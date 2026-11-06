# Language Models: Guessing the Next Word: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: language models.

[c02] Every time your phone suggests the next word, a language model is at work. Today we'll see how the simplest ones do it.

## idea
[c03] Here's the idea in one line. A language model is a very well-read guesser of the next word.

## lm
[c04] A language model gives a chance, a probability, to every word that could come next. That lets it tell likely sentences from unlikely ones.

[c05] After "I'd like a cup of", the word tea is very likely. The word carpet is very unlikely.

[c06] You use one every day: your phone's keyboard, offering the next word as you type.

## count
[c07] The classic way to build one is called an n-gram model, and it learns by counting.

[c08] Read: start with a large amount of text.

[c09] Count: for every short run of words, count which word comes next.

[c10] Divide: turn those counts into chances. If a word followed sixty times out of a hundred, its chance is sixty percent.

[c11] Predict: to continue a sentence, pick one of the likely next words.

## cupof
[c12] Here's a made-up example. In our text, the phrase "a cup of" appears one hundred times. Here's what came next.

[c13] Tea followed sixty times, so its chance is sixty percent.

[c14] Coffee, thirty times: thirty percent.

[c15] Water, nine times.

[c16] And carpet just once, perhaps in a strange story. One percent.

## memory
[c17] How far back should the model look? That's the key choice.

[c18] With a short memory, say the last one or two words, the model is fast and simple. But after just "of", almost anything could come next.

[c19] With a longer memory, say three or four words, the guesses get much better. But most long word sequences are rare, so you need enormous amounts of text to count them. More context helps, until the data runs out.

## zero
[c20] There's a catch. Language is so varied that many perfectly good sentences never appear in the training text.

[c21] If a phrase was never seen, its count is zero, so the model gives it zero chance.

[c22] But never seen doesn't mean impossible. New sentences are written every day.

[c23] The fix is called smoothing: take a little probability from common phrases and share it out, so unseen ones get a small chance too. Think of it as saving a little room for surprises.

## perplexity
[c24] How do we measure a language model? The standard score is called perplexity. It tells us how surprised the model is by real text it hasn't seen before. Lower is better.

[c25] A perplexity of fifty means that, on average, the model is as unsure as if it were choosing between fifty equally likely words each time.

[c26] Think of a quiz contestant. One who can narrow every answer down to two options will do far better than one torn between fifty.

## today
[c27] And here's the link to today. The chatbots you use are language models too. They still guess the next word, again and again. They are just vastly bigger, and they learn with neural networks instead of simple counts. We'll meet those networks in unit four.

## quiz
[c28] Quick quiz. Which word would a language model rate most likely to come next: "Peanut butter and"?

[c29 after=3] Pause the video and choose.

[c30] It's jelly. In English text, "peanut butter and" is followed by jelly far more often than by anything else.

## recap
[c31] Let's recap. A language model gives chances to the next word.

[c32] The simplest kind, an n-gram model, learns by counting which words follow which.

[c33] Smoothing makes sure phrases it never saw still get a small chance.

[c34] And perplexity measures how surprised the model is by real text. Lower is better.

[c35] Next lesson: {{next.short}}. {{next.question}}
