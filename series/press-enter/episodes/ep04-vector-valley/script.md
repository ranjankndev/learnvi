# Vector Valley: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement.
[c01] Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. At Token City, our prompt became a row of ID numbers. Today, those numbers get meaning.

## hook
> Slow down on "queen".
[c03] Here's a famous result. Take the word king, subtract man, add woman, and you land on queen.

[c04] That only works because meaning can live inside numbers. Let's see how.

## route
[c05] On the route map, we've passed through Token City, and we're {@here}here, in {{stop.name}}, where words get a place on a map of meaning.

## idtovec
[c06] First, a quick bridge from our last stop. Here's how a token becomes a vector.

[c07] We start with a token, like the word rain, with its little space in front.

[c08] The tokenizer turned it into an ID, a number like 4,812. On its own, that number says nothing about weather.

[c09] So the model looks up row 4,812 of a giant table, one row for every token it knows.

[c10] And that row is the token's vector: a list of hundreds, or even thousands, of numbers. This is called an embedding.

## map
> Describe the map for people listening.
[c11] Those numbers are easiest to understand as a position on a map. Real maps have hundreds of directions, but let's squash it down to two.

[c12] In one corner, the animals: cat, dog and horse, close together.

[c13] In another corner, the weather: rain, storm and cloud.

[c14] And down at the bottom, food: banana, apple and bread.

[c15] Rain and storm sit very close together, because their meanings are similar.

[c16] Rain and banana are far apart. They have almost nothing in common.

## similar
[c17] To measure how close two words are, the model compares their vectors, usually by the angle between them. This is called cosine similarity, and you don't need the formula to get the idea.

[c18] Rain and storm score high. Rain and banana score low.

[c19] Picture each vector as an arrow. Similar words point in almost the same direction; unrelated words point very different ways.

## learned
[c20] Here's the remarkable part: nobody draws this map by hand.

[c21] During training, words used in similar sentences get nudged a little closer together, over and over.

[c22] Rain and storm keep the same company: wet, cloud, umbrella, forecast. So they drift together.

[c23] After billions of examples, the map organises itself, with no labels at all.

## maths
[c24] And because the map is so well organised, directions on it carry meaning. That's where word maths comes from.

[c25] From king, take away man, add woman, and the nearest word is queen.

[c26] From Paris, take away France, add Italy, and you land near Rome. The direction from a country to its capital is roughly the same everywhere.

## position
[c27] There's one more thing the model needs. A word's vector says what it means, but not where it is. So each token also gets position information, extra numbers mixed in that say where it sits in the sentence.

[c28] Without it, "dog bites man" and "man bites dog" would look exactly the same. Same words, very different news.

[c29] Think of seat numbers on a train ticket. Same passengers, different seats, a different trip.

## search
[c30] You'll meet embeddings outside chatbots too, in search.

[c31] Keyword search finds the exact words you typed. Search for "car", and you'll miss a note that only says "vehicle".

[c32] Meaning search compares embeddings instead, so "car" also finds "vehicle" and "sedan". This is the same trick behind RAG, which we'll meet at our final stop.

## tryIt
> Friendly, like a challenge.
[c33] Time for "Try it yourself": a word-maths game.

[c34] First, make your own guess. Which is closest in meaning to rain: umbrella, storm, or Tuesday?

[c35 after=10] Then ask a chatbot to rank them, and to explain why. See if it agrees with you, and whether it puts umbrella closer than you expected.

## blooper
[c36] AI blooper time. But this one is a serious lesson.

[c37] In 2016, researchers tried word maths on vectors trained on news articles. They asked: man is to computer programmer, as woman is to what?

[c38] And the vectors answered: {@reply}homemaker. The maths worked perfectly. The problem was the text: the vectors had faithfully learned the stereotypes in what they read. Modern models are trained and tested to reduce this, but it's a reminder that a model can only be as fair as its data.

## myth
> Pause before "reality".
[c39] Myth versus reality.

[c40] The myth: each number in a word's vector means one thing, like "is it wet?" or "is it an animal?".

[c41] The {@reality}reality: meaning is spread across many numbers at once. A single number on its own rarely means anything you could put a name to.

## useIt
[c42] And here's your "Use it tomorrow" tip: search your notes by meaning, not keywords.

[c43] Many note and document apps now offer an AI or "semantic" search. When you use it, describe what you mean rather than guessing exact words, like "that article about saving on electricity".

## recap
[c44] Let's stamp the passport. Every token becomes a vector: a position on a map of meaning, where similar words sit close together.

[c45] The map learns itself from text, directions carry meaning, and position numbers keep track of word order.

[c46] But each word still has its meaning on its own. {@question}In "the bank of the river", how does the model know which bank you mean? Next stop: {{next.stop}}.
