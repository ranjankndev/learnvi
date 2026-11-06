# Part-of-Speech Tagging: narration
<!-- One paragraph = one cue. Kit scenes reveal one item per paragraph unless an item has an "at" mark. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: part-of-speech tagging.

[c02] Last time we looked inside words. Today we look at the job each word does in a sentence.

## idea
[c03] Here is the idea for today. The same word can play different roles in different sentences. Part-of-speech tagging works out which role it's playing.

## pos
[c04] A part of speech is the grammatical role a word plays in a sentence: noun, verb, adjective, and so on.

[c05] In "book a flight", the word "book" is a verb. It's something you do.

[c06] Think of words as actors. The same actor can play the hero in one film and the villain in the next. You can only tell which by watching the scene.

## tagset
[c07] A tagger gives every word a short label called a tag. Here are six you'll see everywhere.

[c08] NOUN is a thing or an idea, like "cat" or "flight".

[c09] VERB is an action or a state, like "run", or "book" when you book something.

[c10] ADJ, short for adjective, describes a noun, like "happy" or "red".

[c11] DET, short for determiner, points to a noun, like "the" or "a".

[c12] ADP covers prepositions, like "in", "on" and "to".

[c13] And PRON is a pronoun, a word that stands in for a noun, like "she" or "it".

## tagged
[c14] Let's tag a whole sentence: "I want to book a flight".

[c15] "I" is a pronoun.

[c16] "want" is a verb.

[c17] "to" gets its own small tag, PART, because here it's part of the verb that follows.

[c18] "book" is a verb: booking is the action.

[c19] "a" is a determiner.

[c20] And "flight" is a noun.

## book
> Slow down for the verdict.
[c21] Notice that "book" was a verb there. But it isn't always.

[c22] In "book a flight", it's a verb: an action you do.

[c23] In "read a book", it's a noun: a thing you hold in your hands.

[c24] The spelling is identical, so the word alone can't tell you which it is.

[c25] What decides it is the company it keeps. {@verdict}The neighbouring words decide.

## decide
[c26] So how does a tagger make the decision? It works in three steps.

[c27] Look up: first it checks which tags each word is able to take. "book" could be a noun or a verb.

[c28] Check neighbours: then it looks at what usually comes before and after each tag.

[c29] Pick the best: finally it chooses the tags that make the most sense for the whole sentence together, not just one word at a time.

## clues
[c30] What kinds of clues does a tagger learn? Here are four simple ones.

[c31] After "the" or "a", the next word is usually a noun.

[c32] After "to", there's often a verb, as in "to book".

[c33] A word ending in "l y" is often an adverb, like "quickly".

[c34] And a word ending in "e d" or "i n g" is often a verb, like "walked" or "walking".

## accuracy
[c35] How good are taggers? On English news text, they are very good.

[c36] Just picking each word's most common tag already gets about ninety-two percent of words right.

[c37] Modern taggers, which use the whole sentence, reach about ninety-seven percent. That still means roughly one word in thirty gets the wrong tag, and the hard cases are exactly the ambiguous ones.

## quiz
[c38] Time for a quick quiz. In the sentence "Time flies like an arrow", what part of speech is "flies"?

[c39 after=3] Pause the video and choose: noun, verb, or adjective?

[c40] It's a verb: flying is what time does. But in "Fruit flies like a banana", "flies" is a noun. Same word, different neighbours.

## recap
[c41] Let's recap. A part of speech is the role a word plays in a sentence.

[c42] A tagger labels every word with a tag, like NOUN, VERB or DET.

[c43] Many words, like "book", can take more than one tag.

[c44] And the neighbouring words decide which tag fits.

[c45] Next lesson: {{next.short}}. {{next.question}}
