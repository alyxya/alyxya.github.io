import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

plt.rcParams.update({
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'font.size': 13,
    'axes.labelsize': 14,
    'axes.titlesize': 16,
})

OUT = "/Users/alyxya/Desktop/alyxya.github.io/static/images/posts/kmeans-clustering-convergence"

# Colors
RED = "#d62728"
BLUE = "#1f77b4"
RED_LIGHT = "#ffcccc"
BLUE_LIGHT = "#cce0f5"
GRAY = "#888888"


# ── Diagram 1: Reassignment ──────────────────────────────────────────────────

np.random.seed(42)
# Cluster 1 (blue) points
blue_pts = np.array([[1.0, 3.5], [1.5, 2.5], [0.5, 2.0], [2.0, 3.0], [1.0, 1.5]])
# Cluster 2 (red) points
red_pts = np.array([[5.0, 2.0], [5.5, 3.0], [6.0, 2.5], [5.0, 3.5]])
# The misassigned point: currently red, but closer to blue center
misassigned = np.array([3.0, 2.5])

blue_center = np.array([1.2, 2.5])
red_center = np.array([5.4, 2.75])

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
fig.subplots_adjust(wspace=0.3)

for ax, title, assign_color, assign_center, other_center in [
    (ax1, "Before: suboptimal assignment", RED, red_center, blue_center),
    (ax2, "After: reassigned to nearest center", BLUE, blue_center, red_center),
]:
    # Plot cluster points
    ax.scatter(blue_pts[:, 0], blue_pts[:, 1], c=BLUE, s=80, zorder=3, edgecolors='black', linewidths=0.5)
    ax.scatter(red_pts[:, 0], red_pts[:, 1], c=RED, s=80, zorder=3, edgecolors='black', linewidths=0.5)

    # Plot misassigned point
    ax.scatter(*misassigned, c=assign_color, s=100, zorder=4, edgecolors='black', linewidths=1.0, marker='D')

    # Plot centers
    ax.scatter(*blue_center, c=BLUE, s=200, marker='X', zorder=5, edgecolors='black', linewidths=1.0)
    ax.scatter(*red_center, c=RED, s=200, marker='X', zorder=5, edgecolors='black', linewidths=1.0)

    # Draw line from misassigned point to its assigned center
    dist = np.linalg.norm(misassigned - assign_center)
    ax.plot([misassigned[0], assign_center[0]], [misassigned[1], assign_center[1]],
            color=assign_color, linestyle='--', linewidth=1.5, alpha=0.7, zorder=2)
    # Label distance
    mid = (misassigned + assign_center) / 2
    ax.annotate(f"$d = {dist:.1f}$", xy=mid, fontsize=11, color=assign_color,
                ha='center', va='bottom', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='none', alpha=0.8))

    # Draw faint line to other center for comparison
    dist_other = np.linalg.norm(misassigned - other_center)
    ax.plot([misassigned[0], other_center[0]], [misassigned[1], other_center[1]],
            color=GRAY, linestyle=':', linewidth=1.0, alpha=0.5, zorder=1)

    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_xlim(-0.5, 7.5)
    ax.set_ylim(0.5, 4.5)
    ax.set_aspect('equal')
    ax.set_xlabel("$x_1$")
    ax.set_ylabel("$x_2$")

# Add J decrease annotation
j_before = np.sum((blue_pts - blue_center)**2) + np.sum((red_pts - red_center)**2) + np.sum((misassigned - red_center)**2)
j_after = np.sum((blue_pts - blue_center)**2) + np.sum((red_pts - red_center)**2) + np.sum((misassigned - blue_center)**2)

fig.suptitle(f"Reassigning a point to the nearest center decreases $J$    ($J: {j_before:.1f} \\to {j_after:.1f}$)",
             fontsize=14, y=0.02, fontweight='bold')

plt.savefig(f"{OUT}/reassign-points.png", dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("Saved reassign-points.png")


# ── Diagram 2: Center update ─────────────────────────────────────────────────

np.random.seed(7)
# Points in one cluster
cluster_pts = np.array([
    [1.5, 1.0], [2.5, 3.0], [3.5, 2.0], [2.0, 4.0], [4.0, 3.5], [1.0, 2.5],
])
# Other cluster (for context)
other_pts = np.array([[7.0, 2.0], [7.5, 3.0], [8.0, 2.5], [7.0, 3.5], [8.5, 1.5]])

old_center = np.array([1.5, 3.5])  # Suboptimal center
true_mean = cluster_pts.mean(axis=0)  # Optimal center = mean
other_center = other_pts.mean(axis=0)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
fig.subplots_adjust(wspace=0.3)

for ax, title, center, is_after in [
    (ax1, "Before: center not at mean", old_center, False),
    (ax2, "After: center moved to mean", true_mean, True),
]:
    # Plot other cluster
    ax.scatter(other_pts[:, 0], other_pts[:, 1], c=RED, s=80, zorder=3, edgecolors='black', linewidths=0.5)
    ax.scatter(*other_center, c=RED, s=200, marker='X', zorder=5, edgecolors='black', linewidths=1.0)

    # Plot main cluster points
    ax.scatter(cluster_pts[:, 0], cluster_pts[:, 1], c=BLUE, s=80, zorder=3, edgecolors='black', linewidths=0.5)

    # Plot center
    ax.scatter(*center, c=BLUE, s=200, marker='X', zorder=5, edgecolors='black', linewidths=1.0)

    # Draw lines from points to center
    total_sq_dist = 0
    for pt in cluster_pts:
        d = np.linalg.norm(pt - center)
        total_sq_dist += d**2
        ax.plot([pt[0], center[0]], [pt[1], center[1]],
                color=BLUE, linestyle='--', linewidth=1.0, alpha=0.4, zorder=2)

    # Show J contribution
    ax.annotate(f"$\\Sigma d^2 = {total_sq_dist:.1f}$", xy=(0.02, 0.95),
                xycoords='axes fraction', fontsize=12, color=BLUE, fontweight='bold',
                va='top', bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=BLUE, alpha=0.8))

    if not is_after:
        # Show arrow from old center to mean
        ax.annotate("", xy=true_mean, xytext=old_center,
                    arrowprops=dict(arrowstyle='->', color=GRAY, lw=2, linestyle='--'))
        ax.scatter(*true_mean, c=BLUE, s=120, marker='X', zorder=4, edgecolors=GRAY,
                   linewidths=1.0, alpha=0.4)

    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_xlim(-0.5, 10)
    ax.set_ylim(-0.2, 5.2)
    ax.set_aspect('equal')
    ax.set_xlabel("$x_1$")
    ax.set_ylabel("$x_2$")

j_before_cluster = sum(np.sum((pt - old_center)**2) for pt in cluster_pts)
j_after_cluster = sum(np.sum((pt - true_mean)**2) for pt in cluster_pts)

fig.suptitle(f"Moving center to the mean decreases $J$    ($\\Sigma d^2: {j_before_cluster:.1f} \\to {j_after_cluster:.1f}$)",
             fontsize=14, y=0.02, fontweight='bold')

plt.savefig(f"{OUT}/update-centers.png", dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("Saved update-centers.png")
