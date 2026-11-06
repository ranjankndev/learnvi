# Conditional Random Fields, Intuitively: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: conditional random fields, or CRFs.

[c02] Last time, hidden Markov models tagged words using just two kinds of chances. Today's model can use as many clues as you like.

## idea
[c03] Here's the idea. A CRF tags the whole sentence at once, and it can use as many clues as you like to do it.

## crf
[c04] CRF stands for conditional random field. It's a discriminative model that scores a whole sequence of tags at once, using any clues you give it.

[c05] For example, the word Paris starts with a capital letter and comes right after "to". Together, those clues point strongly to a place name.

[c06] Think of a detective who weighs every clue at once, rather than only looking at the last step they took.

## clues
[c07] What sort of clues? Almost anything you can check about the words. For example:

[c08] Does the word start with a capital letter?

[c09] Does it end in "i n g", "e d", or "l y"?

[c10] What are the words just before and just after it?

[c11] And is it in a list of known names or places? A CRF learns from data how much to trust each clue.

## vs
[c12] Let's compare it with last lesson's model.

[c13] An HMM is generative. Its only clues are the previous tag and the current word, and it learns by counting.

[c14] A CRF is discriminative. It can use clues from anywhere in the sentence, and it learns how much to trust each one. Same job, much more freedom.

## decide
[c15] So how does a CRF choose the tags? Think of it as a points system.

[c16] Score clues: every clue adds or removes points for each possible tag.

[c17] Score pairs: tags that fit well next to each other earn extra points.

[c18] Add up: that gives a total score for every possible sequence of tags.

[c19] Pick the best: and our old friend, the Viterbi algorithm, finds the highest-scoring sequence quickly, without trying them all.

## ner
[c20] CRFs were long a top choice for named entity recognition: finding the names of people, places and dates in text. Here's a sentence.

[c21] Rahul gets PERSON: a capital letter, and a known first name.

[c22] Flew gets O, meaning it isn't part of any name.

[c23] To gets O as well.

[c24] Paris gets PLACE: a capital letter, right after "to".

[c25] On is just another O.

[c26] And Monday gets DATE, because it's a day of the week.

## uses
[c27] Where are CRFs used?

[c28] Finding names of people, places, organisations and dates.

[c29] Part-of-speech tagging and chunking.

[c30] And even today, a CRF layer is often placed on top of a neural network, to make sure the tags it outputs fit together sensibly.

## quiz
[c31] Quick quiz. Which clue can a CRF use easily, but a basic HMM can't: the previous tag, whether the word starts with a capital letter, or the current word?

[c32 after=3] Pause the video and choose.

[c33] It's the capital letter. A basic HMM only uses the previous tag and the word itself. A CRF can add any clue you like.

## recap
[c34] Let's recap. A CRF scores a whole sequence of tags at once.

[c35] It can use any clues you give it: capital letters, word endings, neighbouring words, and more.

[c36] It's discriminative, so it learns how much to trust each clue.

[c37] And the Viterbi algorithm finds the best-scoring tags quickly.

[c38] Next lesson: {{next.short}}. {{next.question}}
