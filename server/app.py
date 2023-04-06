from flask import Flask, request, jsonify
from flask_cors import CORS
from langdetect import detect
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

@app.route('/api/language-detection', methods=['POST'])
def language_detection():
    tweets = request.get_json()
    results = []

    for tweet in tweets:
        try:
            lang = detect(tweet['tweet_text'])
            is_english = lang == 'en'
        except:
            is_english = False

        results.append({
            'tweet_text': tweet['tweet_text'],
            'is_english': is_english
        })

    return jsonify(results)


@app.route('/api/sentiment-score', methods=['POST'])
def sentiment_score():
    tweets = request.json
    results = []

    for tweet in tweets:
        sentiment = TextBlob(tweet['tweet_text']).sentiment
        sentiment_score = {
            'positive': (sentiment.polarity + 1) / 2,
            'neutral': 1 - abs(sentiment.polarity),
            'negative': (1 - sentiment.polarity) / 2
        }

        detected_mood = 'NEUTRAL'
        if sentiment_score['positive'] > sentiment_score['negative']:
            detected_mood = 'POSITIVE'
        elif sentiment_score['negative'] > sentiment_score['positive']:
            detected_mood = 'NEGATIVE'

        results.append({
            'tweet_text': tweet['tweet_text'],
            'sentiment_score': sentiment_score,
            'detected_mood': detected_mood
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
    # app.run(debug=True, host='0.0.0.0', port=8080)