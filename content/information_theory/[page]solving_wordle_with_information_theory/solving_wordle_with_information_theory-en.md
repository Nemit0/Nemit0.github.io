---
title: "Solving Wordle with Information Theory"
description: "A mathematical approach to the popular word game using Shannon Entropy and Information Maximization."
date: "2025-12-21"
category: "information_theory"
tags: ["math", "information theory", "algorithms", "wordle", "entropy"]
author: "Nemit"
---

You know the word guessing game Wordle, right? It took the world by storm a few years ago. But have you ever wondered what the *optimal* strategy is? Not just a good starting word, but a mathematically proven method to solve it as efficiently as possible?

The answer lies in **Information Theory**.

## The Problem Space

Wordle gives you six attempts to guess a hidden 5-letter word.
*   **Green:** Correct letter, correct spot.
*   **Yellow:** Correct letter, wrong spot.
*   **Gray:** Letter not in the word.

There are roughly **2,315** solution words in the original Wordle dictionary (and about 10,000 more allowed guess words that are rarely solutions).

If we simply guessed randomly, our chances would be $\frac{1}{2315}$. To solve this systematically, we need to reduce the pool of possible answers as quickly as possible.

## Quantifying Uncertainty: Entropy

Before diving into Wordle, let's establish a baseline for **Information Theory**.

At its core, information is about **surprise**.
*   If I tell you "The sun will rise tomorrow," you gain almost zero information. You already knew that.
*   If I tell you "It will snow in the Sahara tomorrow," that is highly informative because it is rare and unexpected.

### The Bit: A Unit of Surprise
We measure information in **bits**. One bit is the amount of information you get from the answer to a fair "Yes/No" question (where both answers are equally likely).

Imagine a game where I pick a number between 1 and 8.
*   **Q1:** Is it greater than 4? (Eliminates half) -> 4 numbers left.
*   **Q2:** Is it even? (Eliminates half) -> 2 numbers left.
*   **Q3:** Is it 6? (Eliminates half) -> 1 number left.

It took **3 bits** of information ($\log_2 8 = 3$) to find the answer.

### Applying this to Wordle
Wordle has roughly **2,315** possible answers.
If every word is equally likely ($p = \frac{1}{2315}$), the initial uncertainty (Entropy) is:

$$ 
H = -\log_2 \left( \frac{1}{2315} \right) \approx 11.17 \text{ bits} 
$$

This means we need to "acquire" about 11.17 bits of information to narrow the list down to a single word.
*   A guess that cuts the list in half gives you **1 bit**.
*   A guess that cuts the list to a quarter gives you **2 bits**.
*   The goal of an optimal Wordle solver is to choose guesses that provide the **maximum number of bits** on average.
## The Feedback Loop

When you enter a guess, the game returns a color pattern. There are $3^5 = 243$ possible patterns of Green, Yellow, and Gray.

*   **A highly informative guess** is one where the possible answers are distributed evenly across many different patterns. No matter what pattern the game returns, the list of remaining words shrinks significantly.
*   **A poor guess** is one where most possible answers result in the same pattern (e.g., all Gray). If you get that common pattern, you haven't learned much; you're still stuck with a large pile of candidates.

## The Strategy: Maximize Expected Information

To play optimally, we shouldn't just try to guess the word right away (unless it's the only one left). We should pick the word that maximizes **Expected Information Gain (EIG)**.

For a given guess word $w$, the expected entropy of the remaining possibilities is calculated by summing over all possible color patterns $p$:

$$ E[w] = \sum_{p} P(p) \times (-\log_2(P(p))) 
$$ 

Where $P(p)$ is the probability of receiving pattern $p$ given the current list of possible words.

### The Algorithm
1.  Look at the current list of valid potential solutions.
2.  For every possible guess (even words that *can't* be the answer), simulate it against every potential solution.
3.  Calculate the resulting distribution of color patterns.
4.  Compute the entropy of that distribution.
5.  **Pick the word with the highest entropy.**

## Language Theory & Frequency Analysis

To find the best starting word, we first need to understand the data we are working with: the English language.

Not all letters are created equal. In general English text, the most frequent letters are roughly **E, T, A, O, I, N, S, H, R, D, L, U**. However, Wordle uses a specific subset of 5-letter words.

### The "Wordle" Frequency
In the Wordle solution list (2,315 words), the frequency distribution shifts slightly.
1.  **E** is still king (appearing in ~46% of words).
2.  **A** (~43%) and **R** (~40%) are extremely common.
3.  **S** is tricky. While very common in English, many 5-letter "S" words are plurals, which Wordle's original solution list largely excludes. However, 'S' is still a vital letter to check.

But frequency alone isn't enough. We need **Positional Frequency**.
*   **S** is rare at the *end* of a solution word but common at the *start*.
*   **Y** is very common at the *end* but rare at the start.
*   **E** is very common at the *end* and in the *middle*.

A naive strategy might be to just pick a word with "E, A, R, O, T". But Information Theory asks a deeper question: **Which word splits the possibilities best?**

## The Verdict: The Optimal Starting Word

When we run the simulation against the entire dictionary, calculating the Expected Information Gain for every possible starting word, a few titans emerge.

### 1. "SOARE" / "ROATE" / "RAISE"
These are often considered the mathematical "best" openers for reducing uncertainty.
*   **Entropy:** ~5.87 bits.
*   **Why:** They use the most frequent letters (R, A, E, S, T, O) in highly probable positions.
*   **Result:** After playing "SOARE", the average number of remaining possible solutions drops from 2,315 to roughly **60**.

### 2. "CRANE" / "SALET"
*   **CRANE** was identified by 3Blue1Brown's first bot version as the top pick.
*   **SALET** is often favored by bots playing "Hard Mode" because it leaves flexible options for the second guess.

### 3. The "Worst" Best Guesses
Conversely, words like **"FUZZY"**, **"XYLYL"**, or **"JAZZY"** have very low entropy.
*   If the answer isn't specifically "FUZZY", you will likely get 5 Grays.
*   Getting 5 Grays on "FUZZY" tells you the word doesn't contain F, U, Z, or Y. This leaves *thousands* of words remaining. You have learned almost nothing.

## The Information Trap: A Practical Example

To visualize why information matters more than getting green letters, imagine you reach a point where you know the word ends in **-ATCH**.

Your remaining candidates are: *BATCH, CATCH, HATCH, LATCH, MATCH, PATCH, WATCH*.

If you play "Hard Mode" (or just guess naively), you might guess **BATCH**.
*   If it's right: Great! (1/7 chance)
*   If it's wrong: You get ⬜🟩🟩🟩🟩. You still have 6 words left.
*   Then you guess **CATCH**. Wrong? 5 words left.
*   You could easily run out of turns before finding the answer.

**The Information Theory Approach:**
Instead of guessing a potential answer, you play a "burner" word like **"CLAMP"**.
*   This word uses **C**, **L**, **M**, and **P**.
*   It cannot be the answer (it doesn't end in -ATCH), but it cuts the search space drastically.
    *   If **C** lights up: The answer is *CATCH*.
    *   If **L** lights up: The answer is *LATCH*.
    *   If **M** lights up: The answer is *MATCH*.
    *   If **P** lights up: The answer is *PATCH*.
    *   If none light up: It's *BATCH, HATCH,* or *WATCH*.

By spending one turn on a word that yields 0% chance of winning immediately, you guarantee a win on the next turn by capturing maximum information.

## Hard Mode vs. Normal Mode

There is a subtle but important distinction in game modes.

*   **Normal Mode:** You can play a word purely to get information (a "burner" guess), even if that word cannot possibly be the answer based on previous clues. This is often mathematically optimal. For example, if you are stuck between *hatch, latch, catch, match*, playing a word like "CLAMP" allows you to distinguish between C, L, and M in a single turn.
*   **Hard Mode:** You are forced to use the clues you've found (e.g., you must use the Green letters in their spots). This constrains your ability to explore the search space and often prevents the optimal information-gathering guess, forcing you into a "lucky dip" situation.

## Conclusion

In Information Theory terms, Wordle is not just a word game; it is a **minimax** problem. You are minimizing the maximum number of guesses required by maximizing the bit-reduction of the search space at every step.

By treating every guess as a query to the universe, and every colored tile as a distinct packet of information, we can solve the puzzle with mathematical precision.

*Reference: This approach was famously visualized by Grant Sanderson (3Blue1Brown), whose video on the topic is a must-watch for anyone interested in the intersection of math and gaming.
