# Recurrent Neural Networks: Reading with Memory: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: recurrent neural networks, or RNNs.

[c02] Word vectors give each word a meaning. But a sentence is more than a bag of words: order matters. Today we meet a network that reads in order.

## idea
[c03] Here's the idea. A recurrent neural network reads one word at a time, and carries a memory forward from each word to the next.

## rnn
[c04] RNN stands for recurrent neural network. It reads a sequence step by step, and passes a hidden state, a kind of memory, from each step to the next.

[c05] Reading "the cat sat", it updates its memory after the, again after cat, and again after sat.

[c06] Think of reading a book while keeping a running summary in your head. Each new sentence updates the summary.

## step
[c07] Here's what happens at every single word.

[c08] Read: take the vector for the next word.

[c09] Combine: mix it with the memory carried over from the previous step.

[c10] Update: that mix becomes the new memory.

[c11] Output: if needed, use the memory to produce something, like a guess for the next word. Then move on, and do it all again.

## vs
[c12] Why is this better than the n-gram language models from unit one?

[c13] An n-gram model only looks back a fixed few words, and counts exact sequences, so it knows nothing about phrases it never saw.

[c14] An RNN's memory can, in principle, hold the whole sentence so far. And because it works with word vectors, what it learns about rain also helps with storm.

## uses
[c15] Before today's models arrived, RNNs powered much of NLP.

[c16] Language models, guessing the next word.

[c17] Tagging, giving every word a label, like a part of speech.

[c18] And translation: one RNN reads a sentence in one language, and another writes it out in a different language.

## train
[c19] How does an RNN learn? With a method called backpropagation through time. Picture the network unrolled across all the words. We measure its error, then send that error backwards through every step, adjusting the weights a little.

[c20] So a mistake at word ten can send blame all the way back to word one.

[c21] It's like replaying a chess game move by move, to find which early move really cost you the game.

## forget
[c22] But there's a catch, known as the vanishing gradient problem. Take: "The keys that I left on the kitchen table yesterday are missing." To choose "are" rather than "is", the network must remember "keys" from far back.

[c23] The trouble is that the learning signal fades a little at every step it travels back.

[c24] After many words, it has almost vanished.

[c25] So plain RNNs struggle to remember the start of long sentences. Next lesson fixes this.

## quiz
[c26] Quick quiz. What does an RNN pass from one word to the next?

[c27 after=3] Pause the video and choose.

[c28] Its hidden state: a kind of memory that carries what it has read so far.

## recap
[c29] Let's recap. An RNN reads a sentence one word at a time.

[c30] It carries a hidden state, its memory, from each word to the next.

[c31] It learns by backpropagation through time.

[c32] But plain RNNs tend to forget the start of long sentences.

[c33] Next lesson: {{next.short}}. {{next.question}}
