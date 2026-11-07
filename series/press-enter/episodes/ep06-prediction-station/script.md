# Prediction Station: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement.
[c01] Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. At Attention Junction, the model finally understood our whole prompt. Today, it starts writing back.

## hook
> Slow down on "guessing".
[c03] Here's something that surprises almost everyone. A chatbot doesn't plan out a full answer and then type it.

[c04] It writes one token at a time, each time guessing what should come next. That's it. That's the whole trick.

## route
[c05] On the route map, we've left Attention Junction, and we're {@here}here, at {{stop.name}}, where the answer gets written.

## guess
> Leave a real pause after the question.
[c06 after=4] Let's warm up. Pause and predict: "The cat sat on the..." What word comes next? Mat, moon, or piano?

[c07] You probably said {@answer}mat. You didn't look it up. You just knew what usually comes next. Congratulations: you just did next-token prediction.

## predict
[c08] The model does exactly this, but with numbers. Let's watch it start our running prompt: "Write a short poem about the rain".

[c09] For the very first token, it gives every token it knows a chance. Soft gets twenty-two percent, The gets eighteen, Rain gets fifteen. It picks Soft.

[c10] Now it reads everything again, including the word it just wrote. After Soft, drops is the favourite, at thirty-one percent. Picked.

[c11] After "Soft drops", on is the top choice. But this time, the model picks tap, the third option.

[c12] Wait, why not the favourite? Hold that thought. Either way, "Soft drops tap" is a nice start to a rain poem.

## loop
[c13] So writing an answer is just one small loop, run again and again.

[c14] Read: look at the prompt, and the answer so far.

[c15] Score: give every possible token a chance, tens of thousands of them.

[c16] Pick: choose one.

[c17] Add it, and repeat, until the model picks a special stop token that means "I'm done". That's why answers stream onto your screen word by word.

## sampling
[c18] Now, back to that thought. Why did it pick tap and not the favourite? Because of sampling: picking the next token at random, weighted by its chance, instead of always taking the top one.

[c19] Drops had thirty-one percent and rain had twenty-four, so either one could be picked. The bigger the chance, the more often it wins, but not every time.

[c20] Think of rolling a weighted die. The big faces come up most often, but not every time. That bit of randomness is why the same question can get a different answer each time.

## temperature
[c21] And there's a dial that controls how much randomness you get: temperature. At the normal setting, the chances are used as they are.

[c22] Turn the temperature down, and the favourites get even stronger. On now wins almost every time. Answers become safe, focused, and a little predictable.

[c23] Turn it up, and the chances even out. Tap, of, even dance get a real shot. Answers become surprising and creative, and sometimes a bit strange.

[c24] Same model, same prompt. Only the dial changed.

## hallucinate
[c25] This also explains one of the most important facts about chatbots: why they sometimes make things up. People call it hallucination.

[c26] Remember, the model is always predicting the next likely token.

[c27] So it predicts what sounds right, not what is true. Usually those are the same. Sometimes, they aren't.

[c28] It only says "I don't know" if it learned that saying it fits the moment. Otherwise, a confident guess is just another likely-sounding next token.

[c29] And rare facts get blurry. Exact dates, numbers, quotes, and citations are where made-up answers hide most often.

## safer
[c33] So when should you double-check? Here's a simple guide.

[c34] Riskier: exact dates and numbers, quotes and citations, and very recent or niche facts.

[c35] Safer: give the model the source text yourself, ask it to quote from that source, or turn on web search so it can check.

[c36] The golden rule: fluent is not the same as true. Check anything that matters.

## tryIt
> Friendly, like a challenge.
[c37] Time for "Try it yourself": write the same poem at low and high creativity. Most chat apps hide the temperature dial, so we'll ask for it in words.

[c38] Ask for our rain poem three times, and add: "be very predictable". Notice how similar the poems are.

[c39 after=10] Now ask three more times, with "be wildly creative". Compare the two sets. If you use an AI playground with a real temperature slider, try that too.

## blooper
[c30] AI blooper time. And this one ended up in court.

[c31] In 2023, lawyers in New York asked a chatbot to find past court cases that supported their client's claim.

[c32] It gave them cases, with names, dates and quotes, like {@reply}"Varghese versus China Southern Airlines". They looked perfect. They didn't exist. The lawyers filed them anyway, and the court fined them five thousand dollars.

## myth
> Pause before "reality".
[c40] Myth versus reality.

[c41] The myth: a chatbot looks the answer up in a giant database of facts.

[c42] The {@reality}reality: there is no database of answers inside the model. Each token is predicted fresh, from patterns it learned in training. That's why it can be so fluent, and still be wrong.

## useIt
[c43] And here's your "Use it tomorrow" tip: low temperature for facts, high for brainstorming.

[c44] For facts, code, and summaries, keep it low and precise. For ideas, names, and stories, turn it up. And if there's no dial, just ask for a "precise" answer, or a "wild" one.

## recap
[c45] Let's stamp the passport. The model writes one token at a time: read, score, pick, repeat.

[c46] Sampling adds a little randomness, temperature controls how much, and because it predicts what sounds right, it can sometimes make things up.

[c47] That's the model itself. {@question}But ChatGPT, Claude and Gemini add a lot more around it. So why is a chat app more than just the model? Next stop: {{next.stop}}, our final stop.

