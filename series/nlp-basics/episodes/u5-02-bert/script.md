# BERT: Reading in Both Directions: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}, our final lesson: BERT.

[c02] ELMo showed that pretraining on plain text pays off. BERT took that idea and changed NLP almost overnight.

## idea
[c03] Here's the idea. BERT learned language by filling in blanks, millions and millions of times, reading in both directions at once.

## bert
[c04] BERT, from 2018, stands for bidirectional encoder representations from transformers. It's a model pretrained on lots of text, to understand every word in its full context.

[c05] Show it "she sat on the blank of the river", and it fills in: bank.

[c06] Think of a student who has done millions of fill-in-the-blank exercises, and only then specialises for one particular exam.

## attention
[c07] BERT is built from a Transformer, and its key ingredient is self-attention. Every word looks at every other word in the sentence, and decides which ones matter for its meaning.

[c08] In "the cat drank the milk because it was hungry", the word "it" pays most attention to "cat", because hungry things are cats, not milk.

[c09] Think of a meeting where each person listens most closely to the people who are relevant to them.

## pretrain
[c10] BERT was pretrained with two simple games, played on books and Wikipedia.

[c11] Mask: hide about fifteen percent of the words in each passage.

[c12] Predict: guess the hidden words, using the words on both sides. This is called a masked language model.

[c13] Next sentence: given two sentences, guess whether the second really follows the first.

## masked
[c14] Here are some blanks BERT might fill in.

[c15] "The cat sat on the blank": probably mat.

[c16] "I drank a cup of blank": tea, or coffee.

[c17] "Paris is the capital of blank": France. Filling in blanks like these, it picks up grammar, meaning, and a surprising amount of world knowledge.

## finetune
[c18] How do you use BERT for your own task? Four steps.

[c19] Pretrain once: this expensive part has already been done for you.

[c20] Add a layer: put a small extra layer on top, for your task, like spam or not spam.

[c21] Fine-tune: train the whole thing briefly on your labelled examples. A few thousand is often enough.

[c22] Use: now it can classify, tag, or answer questions.

## vs
[c23] How does BERT compare with ELMo?

[c24] ELMo uses LSTMs that read each direction separately, and its vectors are fed into your own model.

[c25] In BERT, every word sees all the others at once, through self-attention, and the whole model is fine-tuned for your task. When it arrived, it set new records on many language tasks.

## uses
[c26] BERT-style models now do many of the jobs we've met in this course.

[c27] Classifying text: spam, sentiment, topics.

[c28] Finding the names of people, places and dates.

[c29] Answering questions from a passage of text.

[c30] And improving search. Google announced in 2019 that it was using BERT to better understand search queries.

## quiz
[c31] Quick quiz. During pretraining, what does BERT's masked language model do?

[c32 after=3] Pause the video and choose.

[c33] It guesses hidden words, using the words on both sides of the blank.

## recap
[c34] Let's recap. BERT learns language by filling in blanks, reading in both directions.

[c35] Self-attention lets every word look at every other word.

[c36] You pretrain once, then fine-tune for your own task.

[c37] And with that, you've climbed the whole staircase, from tokens all the way to BERT. Thanks for learning with NLP, Simply Explained.
