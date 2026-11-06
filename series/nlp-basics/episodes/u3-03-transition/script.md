# Transition-Based Parsing: Building Trees Step by Step: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: transition-based parsing.

[c02] Last time we learned what a dependency tree looks like. Today we see how a fast parser builds one, a single move at a time.

## idea
[c03] Here's the idea. Read the sentence from left to right, and build the tree using just a few simple moves.

## parser
[c04] A transition parser reads words from a queue called the buffer, keeps words it's still working on in a pile called the stack, and picks one move at each step.

[c05] At any moment, you can describe where it is by what's on the stack and what's left in the buffer.

[c06] Think of sorting post. New letters wait in your in-tray, that's the buffer, and letters you're still dealing with sit in a pile on your desk. That's the stack.

## moves
[c07] The version in your syllabus is called arc-eager. It has four moves.

[c08] SHIFT pushes the next word from the buffer onto the stack.

[c09] LEFT-ARC makes the next word the head of the word on top of the stack, then pops that top word off. Its job is done.

[c10] RIGHT-ARC makes the top word the head of the next word, then pushes the next word onto the stack.

[c11] And REDUCE pops the top word, once it has its head and all its dependents.

## walk
[c12] Let's parse "Priya ate pizza". We start with ROOT on the stack, and all three words in the buffer.

[c13] Step one, SHIFT: Priya moves onto the stack.

[c14] Step two, LEFT-ARC: the next word, ate, becomes the head of Priya. Priya is the subject, so she's popped off.

[c15] Step three, RIGHT-ARC: ROOT becomes the head of ate, and ate goes onto the stack.

[c16] Step four, RIGHT-ARC: ate becomes the head of pizza, the object. The buffer is empty, and the tree is complete.

## choose
[c17] But how does the parser know which move to make? Here's the loop.

[c18] Look: check the word on top of the stack, the next words in the buffer, and the links made so far.

[c19] Score: a trained classifier gives a score to each possible move.

[c20] Act: make the move with the best score.

[c21] Repeat: keep going until the buffer is empty.

## train
[c22] And how is that classifier trained?

[c23] Start with a treebank: sentences whose correct trees are already known.

[c24] For each one, work out the sequence of moves that would build that exact tree. The rule that does this is called the oracle.

[c25] Then train a classifier to predict the oracle's move from what it sees at each step.

## pros
[c26] So what's good about it, and what isn't?

[c27] Strengths: it makes one pass from left to right, using about two moves per word, so it's very fast. And it's easy to give the classifier new clues.

[c28] Limits: it never goes back, so an early mistake can't be undone. And the basic version can only build projective trees, the ones without crossing links.

## quiz
[c29] Quick quiz. In arc-eager parsing, which move puts the next word onto the stack without adding any link?

[c30 after=3] Pause the video and choose.

[c31] It's SHIFT. It simply moves the next word from the buffer onto the stack.

## recap
[c32] Let's recap. A transition parser keeps a stack and a buffer, and makes one move at a time.

[c33] Arc-eager has four moves: SHIFT, LEFT-ARC, RIGHT-ARC and REDUCE.

[c34] A classifier chooses each move, trained by copying an oracle.

[c35] It's very fast, but it never goes back to fix a mistake.

[c36] Next lesson: {{next.short}}. {{next.question}}
