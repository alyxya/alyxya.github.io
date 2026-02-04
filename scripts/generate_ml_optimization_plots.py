import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "static/images/posts/ml-is-optimization"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def R(p):
    """Revenue function: R(p) = p(100 - 2p)"""
    return p * (100 - 2 * p)


def R_prime(p):
    """Derivative of revenue: R'(p) = -4p + 100"""
    return -4 * p + 100


def f(x):
    """f(x) = x^4 - x^3 - x^2 + e^(-x^2)"""
    return x**4 - x**3 - x**2 + np.exp(-(x**2))


def f_prime(x):
    """f'(x) = 4x^3 - 3x^2 - 2x - 2x*e^(-x^2)"""
    return 4 * x**3 - 3 * x**2 - 2 * x - 2 * x * np.exp(-(x**2))


def plot_quadratic_revenue():
    """Plot 1: Basic quadratic revenue function with maximum marked."""
    fig, ax = plt.subplots(figsize=(10, 7))

    p = np.linspace(-5, 55, 500)
    ax.plot(p, R(p), "b-", linewidth=2)

    # Mark the maximum
    ax.plot(25, 1250, "ro", markersize=10)
    ax.annotate(
        "(25, 1250)",
        xy=(25, 1250),
        xytext=(28, 1280),
        fontsize=12,
        color="red",
    )

    ax.set_xlabel("p", fontsize=12)
    ax.set_ylabel("R(p)", fontsize=12)
    ax.set_title(r"$R(p) = p(100 - 2p)$", fontsize=14)
    ax.axhline(y=0, color="gray", linewidth=0.5)
    ax.axvline(x=0, color="gray", linewidth=0.5)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "quadratic-revenue.png", dpi=150, bbox_inches="tight")
    plt.close()
    print("Generated quadratic-revenue.png")


def plot_quadratic_gradient_ascent():
    """Plot 2: Gradient ascent on the quadratic with tangent lines."""
    fig, ax = plt.subplots(figsize=(12, 8))

    p = np.linspace(-5, 55, 500)
    ax.plot(p, R(p), "b-", linewidth=2)

    # Gradient ascent: p_{n+1} = p_n + alpha * R'(p_n)
    alpha = 0.1
    p_vals = [5.0]
    for _ in range(5):
        p_new = p_vals[-1] + alpha * R_prime(p_vals[-1])
        p_vals.append(p_new)

    # Plot points and dotted arrows
    for i, p_i in enumerate(p_vals):
        ax.plot(p_i, R(p_i), "ro", markersize=8)

        # Draw dotted arrow to next point
        if i < len(p_vals) - 1:
            p_next = p_vals[i + 1]
            ax.annotate(
                "",
                xy=(p_next, R(p_next)),
                xytext=(p_i, R(p_i)),
                arrowprops=dict(arrowstyle="->", color="red", lw=1.5),
            )

    # Label start and end
    ax.annotate(
        f"p0 = {p_vals[0]:.0f}",
        xy=(p_vals[0], R(p_vals[0])),
        xytext=(p_vals[0] + 1, R(p_vals[0]) - 120),
        fontsize=11,
        color="red",
    )
    ax.annotate(
        f"p5 = {p_vals[5]:.2f}",
        xy=(p_vals[5], R(p_vals[5])),
        xytext=(p_vals[5] + 1, R(p_vals[5]) + 50),
        fontsize=11,
        color="red",
    )

    ax.set_xlabel("p", fontsize=12)
    ax.set_ylabel("R(p)", fontsize=12)
    ax.set_title(r"Gradient Ascent on $R(p) = p(100 - 2p)$", fontsize=14)
    ax.axhline(y=0, color="gray", linewidth=0.5)
    ax.axvline(x=0, color="gray", linewidth=0.5)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(
        OUTPUT_DIR / "quadratic-gradient-ascent.png", dpi=150, bbox_inches="tight"
    )
    plt.close()
    print("Generated quadratic-gradient-ascent.png")


def plot_single_var_function():
    """Plot 3: f(x) = x^4 - x^3 - x^2 + e^(-x^2)"""
    fig, ax = plt.subplots(figsize=(10, 7))

    x = np.linspace(-1.3, 1.8, 500)
    ax.plot(x, f(x), "b-", linewidth=2)

    ax.set_xlabel("x", fontsize=12)
    ax.set_ylabel("f(x)", fontsize=12)
    ax.set_title(r"$f(x) = x^4 - x^3 - x^2 + e^{-x^2}$", fontsize=14)
    ax.axhline(y=0, color="gray", linewidth=0.5)
    ax.axvline(x=0, color="gray", linewidth=0.5)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "single-var-function.png", dpi=150, bbox_inches="tight")
    plt.close()
    print("Generated single-var-function.png")


def plot_single_var_gradient_descent():
    """Plot 4: Gradient descent from two starting points."""
    fig, ax = plt.subplots(figsize=(12, 8))

    x = np.linspace(-1.4, 2.2, 500)
    ax.plot(x, f(x), "b-", linewidth=2)

    # Two starting points - one leading to each minimum
    starting_points = [
        (-1.2, "red", r"$x_0 = -1.2$"),
        (2.0, "purple", r"$x_0 = 2.0$"),
    ]

    alpha = 0.1
    n_steps = 15

    for x0, color, label in starting_points:
        x_vals = [x0]
        for _ in range(n_steps):
            x_new = x_vals[-1] - alpha * f_prime(x_vals[-1])
            x_vals.append(x_new)

        # Plot points
        for i, x_i in enumerate(x_vals):
            ax.plot(x_i, f(x_i), "o", color=color, markersize=6 if i > 0 else 8)

            # Draw dotted arrow to next point
            if i < len(x_vals) - 1:
                x_next = x_vals[i + 1]
                ax.annotate(
                    "",
                    xy=(x_next, f(x_next)),
                    xytext=(x_i, f(x_i)),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.5),
                )

        # Add to legend
        ax.plot([], [], "o-", color=color, label=label)

    ax.set_xlabel("x", fontsize=12)
    ax.set_ylabel("f(x)", fontsize=12)
    ax.set_title(r"Gradient Descent on $f(x) = x^4 - x^3 - x^2 + e^{-x^2}$", fontsize=14)
    ax.axhline(y=0, color="gray", linewidth=0.5)
    ax.axvline(x=0, color="gray", linewidth=0.5)
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper right", fontsize=11)

    plt.tight_layout()
    plt.savefig(
        OUTPUT_DIR / "single-var-gradient-descent.png", dpi=150, bbox_inches="tight"
    )
    plt.close()
    print("Generated single-var-gradient-descent.png")


if __name__ == "__main__":
    plot_quadratic_revenue()
    plot_quadratic_gradient_ascent()
    plot_single_var_function()
    plot_single_var_gradient_descent()
    print(f"\nAll plots saved to {OUTPUT_DIR}")
