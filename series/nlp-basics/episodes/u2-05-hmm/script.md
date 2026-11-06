# Hidden Markov Models, Intuitively: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: hidden Markov models.

[c02] We've seen that a tagger has to work out whether each word is a noun, a verb, and so on. Today we meet the classic model that does it, without a single formula.

## idea
[c03] Here's the idea. When we read text, we can see the words, but the tags are hidden. A hidden Markov model, or HMM, guesses the hidden tags from the words it can see.

## hmm
[c04] A hidden Markov model imagines that hidden states, like part-of-speech tags, produce the things we observe, like words, one step at a time.

[c05] For "the dog barks", the hidden tags are determiner, noun, verb. What we see are just the words: the, dog, barks.

[c06] Think of a friend's diary that never mentions the weather, only whether they carried an umbrella. You can't see the weather, but you can make a very good guess from the umbrellas.

## two
[c07] An HMM learns just two kinds of chances, both by counting tagged text.

[c08] Transition chances: how likely one tag is to follow another. After a determiner like "the", a noun is very likely.

[c09] Emission chances: how likely a tag is to produce a particular word. A verb might well be the word "barks".

## example
[c10] Let's tag "the dog barks".

[c11] "The" can only be a determiner.

[c12] "Dog" could be a noun, or a verb, as in "to dog someone's steps". But a noun is far more likely after a determiner, so the model picks noun.

[c13] "Barks" could be a noun too, the bark of a tree, in the plural. But after a noun, a verb fits much better. So the best guess is verb.

## viterbi
[c14] How does the model find the best tags for a whole sentence? It uses a clever method called the Viterbi algorithm, in four steps.

[c15] Start: for the first word, score every tag it could have.

[c16] Extend: for each next word, and for each possible tag, keep only the single best path that leads into that tag.

[c17] Finish: at the last word, pick the tag with the best path.

[c18] Trace back: follow that winning path backwards, and you have the best tag for every word.

## fast
[c19] Why go to this trouble?

[c20] Because trying every combination of tags is hopeless. With ten words and a dozen tags each, there are more combinations than there are people on Earth.

[c21] Viterbi keeps only the best path into each tag at each word, and throws the rest away.

[c22] So the work grows gently with the length of the sentence, and even long sentences stay quick to tag.

## limits
[c23] So how good are HMMs?

[c24] Their strengths: they're simple, fast, learn just by counting, and make a strong baseline for tagging.

[c25] Their limits: each step only looks at the previous tag, and it's awkward to add extra clues, like a word's spelling or capital letters. And as a generative model, it spends effort modelling the words themselves, when we only need the tags. Next lesson's model lifts these limits.

## quiz
[c26] Quick quiz. In a hidden Markov model used for tagging, what is hidden: the words, the tags, or the sentence length?

[c27 after=3] Pause the video and choose.

[c28] It's the tags. We can see the words. The tags are the hidden states the model is trying to guess.

## recap
[c29] Let's recap. In an HMM, hidden tags produce the words we can see.

[c30] Transition chances say how likely one tag is to follow another.

[c31] Emission chances say how likely a tag is to produce a word.

[c32] And the Viterbi algorithm finds the best tags for a whole sentence, quickly.

[c33] Next lesson: {{next.short}}. {{next.question}}
