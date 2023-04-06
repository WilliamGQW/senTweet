const languageDetectionApiUrl = 'http://18.191.212.35:8080/api/language-detection';
const sentimentScoreApiUrl = 'http://18.191.212.35:8080/api/sentiment-score';
const extension_id = 'bknbmbgfopkeimcbeenlcojcgcaeohbb';

async function fetchLanguageDetection(tweets) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      extension_id,
      {
        type: 'apiRequest',
        url: languageDetectionApiUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: tweets
      },
      response => {
        // console.log('fetchLanguageDetection response:', response);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

async function fetchSentimentScore(englishTweets) {
  return new Promise((resolve, reject) => {

    chrome.runtime.sendMessage(
      extension_id,
      {
        type: 'apiRequest',
        url: sentimentScoreApiUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: englishTweets
      },
      response => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

function extractTweets() {
  const tweetElements = document.querySelectorAll('[data-testid="tweetText"]');
  console.log(`tweetElements.length: ${tweetElements.length}`);

  const tweets = [];

  tweetElements.forEach(tweet => {
    // const tweetTextElement = tweet.querySelector('[lang="en"]');
    if (tweet) {
      // console.log(tweet.textContent);
      tweets.push({ tweet_text: tweet.textContent, element: tweet });
    }
  });

  return tweets;
}

let analyzedTweetIds = new Set();

async function analyzeTweets() {
  const tweets = extractTweets();

  const tweetTexts = tweets.map(tweet => ({ tweet_text: tweet.tweet_text }));

  console.log("calling fetchLanguageDetection....");
  console.log(`extracted Tweets: ${tweetTexts}`);

  const languageDetectionResults = await fetchLanguageDetection(tweetTexts);
  const englishTweets = languageDetectionResults
    .filter(result => result.is_english)
    .map(result => ({ tweet_text: result.tweet_text }));

  console.log(`There are ${englishTweets.length} english tweets among ${languageDetectionResults.length} all tweets.`);

  const sentimentScores = await fetchSentimentScore(englishTweets);

  sentimentScores.forEach(score => {
    const tweetElement = tweets.find(tweet => tweet.tweet_text === score.tweet_text).element;
    const emoji = score.detected_mood === 'POSITIVE' ? '😊' : score.detected_mood === 'NEGATIVE' ? '☹️' : '😐';

    // Find the parent element with data-testid="cellInnerDiv"
    let parentElement = tweetElement.parentElement;
    while (parentElement && parentElement.getAttribute('data-testid') !== 'cellInnerDiv') {
      parentElement = parentElement.parentElement;
    }

    if (parentElement) {
      // Find the time element within the parent element
      const dateElement = parentElement.querySelector('time');

      if (dateElement) {
        const separator = document.createTextNode(' · ');
        const moodElement = document.createElement('span');
        moodElement.textContent = `Detected Mood: ${emoji}`;

        dateElement.parentNode.insertBefore(separator, dateElement.nextSibling);
        dateElement.parentNode.insertBefore(moodElement, separator.nextSibling);
      } else {
        console.error('Could not find date element for the tweet:', tweetElement);
      }
    } else {
      console.error('Could not find parent element with data-testid="cellInnerDiv" for the tweet:', tweetElement);
    }
  });
}


// async function analyzeTweets() {
//   const tweets = extractTweets();

//   const newTweets = tweets.filter(tweet => !analyzedTweetIds.has(tweet.element.getAttribute('data-tweet-id')));

//   // Add new tweet ids to the analyzedTweetIds set
//   newTweets.forEach(tweet => analyzedTweetIds.add(tweet.element.getAttribute('data-tweet-id')));

//   const tweetTexts = newTweets.map(tweet => ({ tweet_text: tweet.tweet_text }));

//   console.log("calling fetchLanguageDetection....");
//   console.log(`extracted Tweets: ${tweetTexts}`);

//   const languageDetectionResults = await fetchLanguageDetection(tweetTexts);
//   const englishTweets = languageDetectionResults
//     .filter(result => result.is_english)
//     .map(result => ({ tweet_text: result.tweet_text }));

//   console.log(`There are ${englishTweets.length} english tweets among ${languageDetectionResults.length} all tweets.`);

//   const sentimentScores = await fetchSentimentScore(englishTweets);

//   sentimentScores.forEach(score => {
//     const tweetElement = tweets.find(tweet => tweet.tweet_text === score.tweet_text).element;
//     const emoji = score.detected_mood === 'POSITIVE' ? '😊' : score.detected_mood === 'NEGATIVE' ? '☹️' : '😐';

//     // Find the parent element with data-testid="cellInnerDiv"
//     let parentElement = tweetElement.parentElement;
//     while (parentElement && parentElement.getAttribute('data-testid') !== 'cellInnerDiv') {
//       parentElement = parentElement.parentElement;
//     }

//     if (parentElement) {
//       // Find the time element within the parent element
//       const dateElement = parentElement.querySelector('time');

//       if (dateElement) {
//         const separator = document.createTextNode(' · ');
//         const moodElement = document.createElement('span');
//         moodElement.textContent = `Detected Mood: ${emoji}`;

//         dateElement.parentNode.insertBefore(separator, dateElement.nextSibling);
//         dateElement.parentNode.insertBefore(moodElement, separator.nextSibling);
//       } else {
//         console.error('Could not find date element for the tweet:', tweetElement);
//       }
//     } else {
//       console.error('Could not find parent element with data-testid="cellInnerDiv" for the tweet:', tweetElement);
//     }
//   });
// }

function observeTweets(callback) {
  const mainContentElement = document.querySelector('div[data-testid="primaryColumn"]');
  
  if (mainContentElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          callback();
        }
      });
    });

    observer.observe(mainContentElement, { childList: true, subtree: true });
  } else {
    console.error('Could not find main content element to observe');
  }
}


function onContentLoaded() {
  setTimeout(analyzeTweets, 2800); // Wait for 3 seconds before running analyzeTweets
  observeTweets(analyzeTweets);

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onContentLoaded);
} else {
  onContentLoaded();
}