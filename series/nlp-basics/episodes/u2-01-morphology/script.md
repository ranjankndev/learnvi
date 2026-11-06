# Morphology: narration
<!-- One paragraph = one cue. Kit scenes reveal one item per paragraph unless an item has an "at" mark. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: morphology.

[c02] So far we have cut text into words and tokens. Today we look inside the words themselves.

## idea
[c03] Here is the idea for today. Words are built from smaller pieces, and each of those pieces carries meaning.

## morpheme
[c04] Those pieces are called morphemes. A morpheme is the smallest part of a word that still carries meaning.

[c05] Take the word "unbreakable". It is three morphemes: "un", meaning not; "break"; and "able", meaning it can be done.

[c06] Think of morphemes as LEGO bricks. A small set of bricks snaps together into thousands of different words.

## kinds
[c07] Morphemes come in two kinds.

[c08] Free morphemes can stand alone as words of their own, like "break", "cat" or "happy".

[c09] Bound morphemes can't stand alone. They have to attach to another piece, like "un", "able", or the "s" that makes a plural. {@verdict}Most words mix both kinds.

## affixes
[c10] Bound pieces that attach to the front or the back of a word are called affixes. Here are some you use every day.

[c11] "un" goes at the front, so it's a prefix: unhappy.

[c12] "re" is a prefix too: rebuild means build again.

[c13] At the back, "s" is a suffix that makes a plural: cats.

[c14] "ness" turns an adjective into a noun: kind becomes kindness.

[c15] And "e d" puts a verb in the past: walk becomes walked.

## inflect
[c16] Affixes do one of two jobs, and it helps to keep them apart.

[c17] Inflection gives the same word a new form. "walk" and "walked" are the same verb, just in the past. "cat" and "cats" are the same noun, just plural.

[c18] Derivation builds a different word. "happy" is an adjective, but "happiness" is a new word, a noun. "teach" becomes "teacher": a person, not an action.

[c19] So here's the short version. {@verdict}Inflection changes the form; derivation changes the word.

## stem
[c20] In NLP we often want to get back to the root of a word, so that "studies" and "study" count as the same thing. There are two ways to do it.

[c21] Stemming simply chops endings off by rule. It's fast, but the result isn't always a real word. Lemmatization looks the word up, and returns its dictionary form, called the lemma.

[c22] "studies": a common stemmer gives "studi", which isn't a word. Lemmatization gives "study".

[c23] "running": both give "run".

[c24] "better": stemming leaves it alone, but lemmatization knows it's a form of "good".

[c25] And "was": stemming chops it to "wa", while lemmatization knows it's a form of "be".

## why
[c26] So why does NLP care about word parts? Four reasons.

[c27] There are fewer things to learn. Walk, walks, walked and walking all share one root.

[c28] Search gets better. Type "running", and you also find pages that say "run".

[c29] It helps with new words. Even if "ungoogleable" isn't in the dictionary, its pieces are: un, google, able.

[c30] And it matters even more in languages like Turkish or Finnish, where one long word can hold what English says in a whole sentence.

## quiz
[c31] Time for a quick quiz. How many morphemes are in the word "unbreakable"?

[c32 after=3] Pause the video and count the pieces.

[c33] The answer is three: "un", "break", and "able". A prefix, a root, and a suffix.

## recap
[c34] Let's recap. A morpheme is the smallest piece of a word that carries meaning.

[c35] Free morphemes can stand alone; bound morphemes have to attach to something.

[c36] Inflection changes a word's form; derivation builds a new word.

[c37] And stemming chops endings by rule, while lemmatization looks up the real root.

[c38] Next lesson: {{next.short}}. {{next.question}}
