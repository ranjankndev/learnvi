# Text Classification: narration
<!-- One paragraph = one cue. Kit scenes reveal one item per paragraph unless an item has an "at" mark. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: text classification.

[c02] Last time we cut text into tokens. Today we use those pieces to answer a simple question about a whole message: which kind is it?

## idea
[c03] Here is the idea in one line. Classification means putting each piece of text into the right box.

## everyday
[c04] You use text classifiers every day, often without noticing. Here are four.

[c05] Your email decides whether each message is spam or not spam.

[c06] Shopping sites sort reviews into positive and negative.

[c07] Help desks route each support ticket to the team that should answer it.

[c08] And your phone guesses which language a message is written in, so it can offer to translate it.

## classifier
[c09] The program doing the sorting is called a classifier. It reads a piece of text and picks one label from a fixed list.

[c10] For example, it reads "WIN a FREE prize!!!" and picks the label "spam".

[c11] Think of a post-office sorter: every letter goes into exactly one pigeonhole, based on what's written on it.

## learn
[c12] Nobody writes the sorting rules by hand. A classifier learns them from examples, in four steps.

[c13] Collect: gather lots of texts that already have the right label, like emails people have marked as spam or not spam.

[c14] Find clues: turn each text into clues the computer can count. The simplest clues are the words themselves.

[c15] Train: let the computer learn which clues usually point to which label.

[c16] Predict: give it a new text it has never seen, and it picks a label.

## clues
[c17] Here is a small made-up example. Out of a hundred training emails, this table shows how many spam and normal emails contain each word.

[c18] "free" appears in thirty spam emails, but only two normal ones. A strong hint of spam.

[c19] "winner" is similar: eighteen spam emails, just one normal one.

[c20] "meeting" goes the other way: it appears in twenty-five normal emails and only one spam email.

[c21] And "invoice" leans towards normal mail too, but more weakly: twelve normal, three spam.

## bayes
[c22] One of the oldest and simplest classifiers is called Naive Bayes. The idea is to let the clues vote.

[c23] Every word in the email is a clue.

[c24] Words that are common in spam add weight to the spam side.

[c25] Words that are common in normal mail add weight to the normal side.

[c26] Whichever side ends up heavier wins. And it's called "naive" because it judges each word on its own, ignoring word order, which is a simplification that works surprisingly well.

## eval
> Slow down for the verdict.
[c27] So how do we know if a spam filter is any good? There are two questions to ask, and they're easy to mix up.

[c28] The first is precision: of all the mail the filter marked as spam, how much really was spam? Low precision means real emails go missing.

[c29] The second is recall: of all the spam that arrived, how much did the filter catch? Low recall means spam fills your inbox. {@verdict}A good filter needs both.

## test
[c30] Let's check our filter on a hundred test emails.

[c31] It marked twenty of them as spam.

[c32] Eighteen of those twenty really were spam, so its precision is eighteen out of twenty: ninety percent.

[c33] But the test set held twenty-four spam emails in total, and it caught eighteen. So its recall is eighteen out of twenty-four: seventy-five percent.

## quiz
[c34] Time for a quick quiz. An important email from your boss lands in the spam folder. Which number went down: precision, or recall?

[c35 after=3] Pause the video and decide.

[c36] It's precision. A real email marked as spam is a false alarm, and false alarms lower precision.

## recap
[c37] Let's recap. A classifier reads text and picks one label from a fixed list.

[c38] It learns from labelled examples, using words as clues.

[c39] Naive Bayes lets every word vote on its own, and the heavier side wins.

[c40] Precision asks: were the alarms right? Recall asks: did we miss anything?

[c41] Next lesson: {{next.short}}. {{next.question}}
