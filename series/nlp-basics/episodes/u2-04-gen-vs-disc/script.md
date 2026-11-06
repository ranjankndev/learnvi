# Generative vs Discriminative Models: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: generative versus discriminative models.

[c02] These two words sound technical, but they describe a simple difference in how a model learns. Once you see it, a lot of NLP falls into place.

## idea
[c03] Here's the whole idea. One kind of model learns how each kind of data is made. The other kind just learns where the boundary between them is.

## gen
[c04] A generative model learns what examples of each class look like. Then, for a new example, it asks: which class most likely produced this?

[c05] For spam, it learns that spam emails often contain words like free, winner and prize, and that normal emails contain other words.

[c06] Think of an artist who has learned to paint both cats and dogs. Show them a new animal, and they ask which of their two pictures it resembles.

## disc
[c07] A discriminative model skips that. It learns directly which clues separate the classes, without learning how the data is made.

[c08] For spam, it might learn that the word free, together with lots of links, pushes an email over the line into spam.

[c09] Think of a judge at a pet show who can instantly tell cats from dogs, but couldn't paint either one.

## side
[c10] Let's put them side by side.

[c11] The generative model learns what each class looks like, so in principle it could even create new examples. Naive Bayes and hidden Markov models are generative.

[c12] The discriminative model learns only the dividing line, and answers just one question: which class is this? Logistic regression and conditional random fields are discriminative.

## models
[c13] Here are models from this course, sorted into the two kinds.

[c14] Naive Bayes, from our text classification lesson, is generative.

[c15] Hidden Markov models, a classic way to tag parts of speech, are generative too. They're next lesson.

[c16] Logistic regression, another popular text classifier, is discriminative.

[c17] And conditional random fields, used for tagging and chunking, are discriminative. They're the lesson after.

## when
[c18] So which is better? It depends on your data.

[c19] Generative models often learn well from just a little data, because they make strong assumptions about how the data is made. When those assumptions are wrong, though, they pay for it.

[c20] Discriminative models can mix many overlapping clues freely, and with plenty of labelled data they're usually more accurate. That's why most modern systems are discriminative.

## quiz
[c21] Quick quiz. A model learns only the line that separates spam from normal mail, and nothing about how emails are written. What kind is it?

[c22 after=3] Pause the video and choose.

[c23] It's discriminative. It learns the boundary between the classes, not how the data is made.

## recap
[c24] Let's recap. Generative models learn how each class's data is made.

[c25] Discriminative models learn the boundary between classes.

[c26] Naive Bayes and hidden Markov models are generative. Logistic regression and conditional random fields are discriminative.

[c27] And with plenty of labelled data, discriminative models usually come out ahead.

[c28] Next lesson: {{next.short}}. {{next.question}}
