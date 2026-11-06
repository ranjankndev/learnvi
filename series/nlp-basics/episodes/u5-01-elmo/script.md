# Contextual Embeddings and ELMo: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome to unit five of NLP, Simply Explained. This is lesson {{episode.lesson}}: contextual embeddings, and a model called ELMo.

[c02] In unit four, every word got one vector. Today we fix the biggest problem with that idea.

## idea
[c03] Here's the idea. The same word should get a different vector when it's used in a different sentence.

## vs
[c04] Let's compare the two kinds.

[c05] Static vectors, like Word2Vec's, give each word exactly one vector. "Bank" always gets the same one, whatever the sentence.

[c06] Contextual vectors give a word a fresh vector every time it's used, based on the sentence around it. So a river bank and a money bank get different vectors.

## bank
[c07] Here's the word "bank" in three sentences. A contextual model gives it three different vectors.

[c08] "We sat on the bank of the river": the side of a river.

[c09] "I paid money into the bank": a place that keeps money.

[c10] "Don't bank on it": here it's a verb, meaning to rely on something.

## elmo
[c11] ELMo, from 2018, stands for embeddings from language models. Its word vectors come out of a deep language model built from LSTMs reading in both directions, so each vector depends on the whole sentence.

[c12] For "bank" in our first sentence, the vector is computed from everything around it: sat on the, of the river.

[c13] It's like asking someone what a word means while they're holding the whole sentence in mind.

## build
[c14] Here's how it works, in four steps.

[c15] Pretrain: train two LSTM language models on a huge amount of plain text. One predicts the next word, reading forwards. The other predicts the previous word, reading backwards.

[c16] Read: run both models over your sentence.

[c17] Mix: for each word, blend the outputs of their layers, using weights learned for your task.

[c18] Plug in: feed these vectors into your own model, for tagging, question answering, or whatever you're building.

## layers
[c19] Why blend the layers? Because they learn different things.

[c20] The lower layers capture more about grammar, like parts of speech.

[c21] The higher layers capture more about meaning in context, like which sense of "bank" is meant.

[c22] So each task can lean on the layers it needs most.

## impact
[c23] ELMo was a turning point.

[c24] Adding its vectors improved results across many NLP tasks at once.

[c25] It proved that pretraining on plain, unlabelled text really pays off.

[c26] And it opened the door to BERT, our next and final lesson.

## quiz
[c27] Quick quiz. What's the main difference between ELMo's vectors and Word2Vec's?

[c28 after=3] Pause the video and choose.

[c29] ELMo's vectors depend on the sentence. Word2Vec gives each word one fixed vector, but ELMo computes a new one every time the word is used.

## recap
[c30] Let's recap. Static vectors give a word one vector, whatever the sentence.

[c31] Contextual vectors change with the sentence, so "bank" can mean different things.

[c32] ELMo takes its vectors from a two-way LSTM language model, pretrained on lots of text.

[c33] And it showed that pretraining on plain text pays off.

[c34] Next lesson: {{next.short}}. {{next.question}}
