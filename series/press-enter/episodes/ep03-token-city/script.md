# Token City — narration
<!--
  One paragraph = one cue = one recording. Retake any cue on its own.
  {@name} marks a word that an animation waits for (see episode.json props).
  > lines are directions for whoever records; they are not spoken.
  {{...}} values come from config/series.json, so renaming a stop updates the narration.
-->

## passport
> Upbeat, like a travel announcement.
[c01] Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] Welcome to stop number {{episode.number}} on our journey, following one little prompt from your keyboard all the way to an answer.

## hook
> Slow down on "never".
[c03] Here's something strange. The model you chat with has never seen the word "rain". Not once. It only ever sees a number, something like {@number}4,812.

[c04] Today we find out how your words become numbers, why the model sometimes can't spell, and why this decides how much every message costs.

## route
[c05] On the route map, we left the Departure Gate, passed through Library Town where the model was trained, and now we're {@here}here: {{stop.name}}, the first stop inside the model itself.

## numbers
> Describe the screen for people listening.
[c06] Let's start with our traveller, the prompt: "{{series.runningPrompt}}". On the left of the screen is the prompt as you typed it.

[c07] A computer can't do maths on letters. Underneath, your text is already stored as numbers, {@bytes}one number per character. But a model that works one character at a time would be slow, and a single letter means very little.

[c08] So the model cuts your text into bigger pieces called tokens, and {@lookup}looks each one up in a fixed list, its vocabulary. Every token in that list has an ID number. Those IDs are all the model ever sees.

## options
[c09] So how big should the pieces be? There are three choices, and the word "raindrops" will help us compare them.

[c10] Choice one: single {@chars}characters. R, A, I, N, and so on. The vocabulary is tiny, and nothing is ever unknown. But every sentence becomes a very long sequence, which is slow and expensive.

[c11] Choice two: whole {@words}words. Now "raindrops" is one piece. But there are millions of words, names and typos. Any word missing from the list becomes "unknown", and the model is blind to it.

[c12 after=3] Pause and predict. If characters are too small and words are too big, what would you choose?

[c13] The answer is the middle path: {@subwords}subwords. Common words stay whole. Rare words are built from smaller pieces, like "rain" plus "drops". Every modern chatbot works this way.

## bpe
[c14] The most popular way to build that list of subwords is called Byte Pair Encoding, or BPE. The idea fits in one sentence: keep gluing together the pair of pieces that appears most often.

[c15] Let's run it on a tiny example. Our training text has "rain" 9 times, "rainy" 4 times, "raining" 5 times and "train" 3 times. We start with single letters.

[c16] Now we count every pair of neighbouring letters across all those words. On screen, the bars show the counts.

[c17 after=3] {@pause}Pause and predict: which pair wins? Hint: "raining" has it twice.

[c18] It's "i" followed by "n", 26 times. So we {@merge}glue them into one new piece, "in", and add it to the vocabulary.

[c19] Then we {@repeat}count again and repeat. {@ra}"r" plus "a" wins next, 21 times. Then {@rain}"ra" plus "in" becomes "rain", a whole word as a single token.

[c20] Real tokenizers repeat this tens of thousands of times over huge amounts of text. What's left is a vocabulary where frequent words are one token and rare words are a few.

## demo
> Live demo: show a tokenizer website with coloured blocks.
[c21] Let's look at real tokens. Here's our {@prompt}prompt in a tokenizer. Each coloured block is one token. In most modern tokenizers, every word in it is common enough to be a single token, and the space usually rides along at the start of the word.

[c22] Now a rarer word: "tokenization". It's {@long}split into "token" and "ization". The model has seen both pieces many times, so it still understands the word.

[c23] And here's a famous one: {@straw}"strawberry". One tokenizer splits it into "str", "aw", "berry". Keep that in mind; it comes back in a minute.

## matters
[c24] So why should you care about tokens? Four reasons.

[c25] One: price. AI services charge per token, for what you send and for what you get back. Long prompts and long answers literally cost more.

[c26] Two: memory. A model can only read a limited number of tokens at once, called its context window. Very long chats eventually push old messages out.

[c27] Three: languages. Tokenizers are usually trained mostly on English, so the same sentence in Hindi or many other languages can take several times as many tokens, making it slower and costlier.

[c28] Four: spelling. The model sees "straw" and "berry", not the letters inside them. That's why counting the letters in "strawberry" has tripped up so many chatbots.

## tryIt
> Friendly, like a challenge.
[c29] Time for "Try it yourself". Grab your phone, you have one minute.

[c30] First, ask your favourite chatbot: how many letters "r" are in "strawberry"? Newer models usually get it right, but watch how they work it out.

[c31 after=20] Second, open any free online tokenizer. Paste one English sentence, then the same sentence in Hindi, and compare the token counts.

## blooper
[c32] AI blooper time! In 2023, researchers found a strange token: " SolidGoldMagikarp", a username that had made it into an early GPT vocabulary.

[c33] When they asked the chatbot of the day to simply repeat it, the model replied with a completely different word. The token was in the vocabulary, but the model had almost never seen it during training, so it had no idea what it meant.

## myth
> Pause before "reality".
[c34] Myth versus reality.

[c35] The myth: one token equals one word.

[c36] The {@reality}reality: in English, a token is about three quarters of a word on average, or roughly four characters. A hundred words is around 130 tokens. Other languages, code and emoji can use many more.

## useIt
[c37] And here's your "Use it tomorrow" tip: write shorter prompts to save money on APIs.

[c38] Cut polite filler, don't paste a whole document when one section will do, and ask for answers of the length you actually need. Fewer tokens in and out means a lower bill and a faster reply.

## recap
[c39] Let's stamp the passport. At {{stop.name}}, your prompt was cut into subword tokens, built by gluing common pairs, and each token became an ID number.

[c40] But those numbers are just labels. 4,812 says nothing about weather.

[c41] Next stop: {{next.stop}}. {@question}{{next.question}}
