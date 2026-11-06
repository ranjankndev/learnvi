# Departure Gate: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement.
[c01] Welcome aboard. Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. We're going to follow one little prompt, from your keyboard all the way to an answer.

## hook
> Slow down on "follow".
[c03] You typed seven words: "{{series.runningPrompt}}". A couple of seconds later, a poem appeared.

[c04] In those seconds, your words were cut into pieces, turned into numbers, run through billions of calculations, and rebuilt one piece at a time. Let's follow them.

## route
[c05] Here's our route map. We're {@here}here, at the {{stop.name}}, where we look at the whole journey before we zoom into each stop.

## journey
[c06] The whole trip has five stages. On screen, each box lights up as we reach it.

[c07] Send: your prompt leaves your phone and travels to a server, where the model actually runs.

[c08] Tokenize: the text is cut into pieces called tokens.

[c09] Embed: every token is turned into a long list of numbers.

[c10] Attend: the tokens look at each other, to work out what the whole prompt means.

[c11] Predict: the model writes the answer, one token at a time. Let's walk through each stage.

## send
[c12] Stage one. When you press Enter, the app sends more than the words you typed.

[c13] There's your prompt, of course: "{{series.runningPrompt}}".

[c14] There are hidden instructions from the app, telling the model how to behave. These are often called the system prompt.

[c15] And there's the chat so far. Every earlier message in the conversation is sent again, so the model can see it.

[c16] All of that travels together to a server in a data centre, where the model lives.

## tokens
[c17] Stage two. The model can't read letters, so the text is cut into tokens. Here's our {@prompt}prompt, with each coloured block showing one token.

[c18] Common words are usually a single token each, and the space tends to travel along at the front. Rarer words get split into smaller pieces. Each token is then swapped for an ID number. That's our next-but-one stop, Token City.

## embed
[c19] Stage three. An ID number on its own means nothing. So each token is turned into an embedding: a long list of numbers that captures what it means.

[c20] The token "rain" becomes a list of hundreds, or even thousands, of numbers.

[c21] Think of it as an address on a map of meaning. "Rain" lives close to "storm" and "cloud", and far away from "banana".

## attend
[c22] Stage four is the heart of the model, called a transformer. Here, the tokens look at each other.

[c23] Every token looks at every other token in the prompt, and decides which ones matter to it.

[c24] For example, "poem" and "short" tell the model what "rain" is for: it's the subject of a short poem, not a weather report.

[c25] This happens again and again, in many layers, and with each layer the model's picture of your request gets sharper.

## predict
[c26] Stage five is where the answer is written. And here's the surprise: the model never plans the whole poem. It writes one token at a time, in a loop.

[c27] Predict: it gives a chance to every possible next token.

[c28] Pick: it chooses one of the likely ones.

[c29] Add: it sticks that token on the end of the text.

[c30] Repeat: then it reads everything again, including what it just wrote, and predicts the next token. Over and over, until the answer is done.

## stream
[c31] That loop explains something you've probably noticed: answers appear word by word.

[c32] Watch the phone on the right. {@stream}Each piece shows up the moment it's predicted, so you can start reading straight away, instead of waiting for the whole poem to finish.

[c33] It's like a very well-read autocomplete: write a word, reread everything, write the next word.

## tryIt
> Friendly, like a challenge.
[c34] Time for "Try it yourself". Grab your phone, it takes one minute.

[c35] First, ask your chatbot a short question, and count the seconds until the very first word appears.

[c36 after=10] Then ask it for a long essay. Does the first word take any longer to appear? Usually not much, because it streams the essay one piece at a time, just like a short answer.

## myth
> Pause before "reality".
[c37] Myth versus reality.

[c38] The myth: the model searches the internet to find your answer.

[c39] The {@reality}reality: by default, it writes from patterns it learned during training, one token at a time. Some apps can add a web search, but that's an extra tool around the model, and we'll see it at our final stop.

## useIt
[c40] And here's your "Use it tomorrow" tip: why long chats get slower and costlier.

[c41] Remember stage one: every message re-sends the whole chat so far. So a long conversation gives the model more to read every single time, which makes replies slower and, on paid services, more expensive. When you switch to a new topic, start a new chat.

## recap
[c42] Let's stamp the passport. When you press Enter, your prompt is sent, cut into tokens, turned into numbers, and read by a transformer.

[c43] Then the answer is written one token at a time, and streamed to you as it goes.

[c44] {@question}But how did the model learn any of this in the first place? Next stop: {{next.stop}}.
