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
    if (tweet) {
      const tweetId = tweet.getAttribute('data-unique-id');

      if (tweetId) {
        tweets.push({ tweet_text: tweet.textContent, element: tweet, id: tweetId, detected_mood: detectedMoods[tweetId] });
      } else {
        const newTweetId = `tweet_${Date.now()}_${Math.random().toString(7)}`;
        tweet.setAttribute('data-unique-id', newTweetId);
        tweets.push({ tweet_text: tweet.textContent, element: tweet, id: newTweetId });
      }
    }
  });

  return tweets;
}

let analyzedTweetTexts = new Set();
const detectedMoods = {}; // create an object to store the detected moods:

async function analyzeTweets() {
  const tweets = extractTweets();
  console.log('Tweets:', tweets);

  // If no tweets are found, try again after a short delay
  if (tweets.length === 0) {
    setTimeout(analyzeTweets, 1000);
    return;
  }

  // Filter out tweets that have already been analyzed
  const newTweets = tweets.filter(tweet => !analyzedTweetTexts.has(tweet.tweet_text));
  console.log('New tweets:', newTweets);
  // Add new tweet texts to the analyzedTweetTexts set
  newTweets.forEach(tweet => analyzedTweetTexts.add(tweet.tweet_text));

  const tweetTexts = newTweets.map(tweet => ({ tweet_text: tweet.tweet_text }));

  console.log("calling fetchLanguageDetection....");
  console.log(`extracted Tweets: ${tweetTexts}`);

  const languageDetectionResults = await fetchLanguageDetection(tweetTexts);
  console.log('Language detection results:', languageDetectionResults);

  const englishTweets = languageDetectionResults
    .filter(result => result.is_english)
    .map(result => ({ tweet_text: result.tweet_text }));

  console.log(`There are ${englishTweets.length} english tweets among ${languageDetectionResults.length} all tweets.`);

  const sentimentScores = await fetchSentimentScore(englishTweets);
  console.log('Sentiment scores:', sentimentScores);

  sentimentScores.forEach(score => {
    // const tweetElement = tweets.find(tweet => tweet.tweet_text === score.tweet_text).element;
    const tweetData = tweets.find(tweet => tweet.tweet_text === score.tweet_text && !tweet.processed);
    tweetData.processed = true;
    detectedMoods[tweetData.id] = score.detected_mood; // Store the detected mood

    const emoji = score.detected_mood === 'POSITIVE' ? '😊' : score.detected_mood === 'NEGATIVE' ? '☹️' : '😐';

    // Find the parent element with data-testid="cellInnerDiv"
    let parentElement = tweetData.element.parentElement;
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


// function observeTweets(callback) {
//   const tweetElements = document.querySelectorAll('[data-testid="tweetText"]');
//   const options = {
//     root: null,
//     rootMargin: '0px',
//     threshold: 0
//   };

//   const observer = new IntersectionObserver((entries, observer) => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         callback();
//       }
//     });
//   }, options);

//   tweetElements.forEach(tweet => {
//     observer.observe(tweet);
//   });
// }

// function onContentLoaded() {
//   setTimeout(analyzeTweets, 3000); // Wait for 3 seconds before running analyzeTweets
//   observeTweets(analyzeTweets);
// }

function handleScroll(callback) {
  let timer;
  const delay = 1000; // You can adjust the delay value as needed

  window.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(callback, delay);
  });
}

function observeTweets(callback) {
  const mainContentElement = document.querySelector('div[data-testid="primaryColumn"]');

  if (mainContentElement) {
    const observer = new MutationObserver((mutations) => {
      let shouldAnalyzeTweets = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          shouldAnalyzeTweets = true;
        }
      });

      if (shouldAnalyzeTweets) {
        setTimeout(callback, 1000); // Add a delay before calling the callback to give Twitter time to load new content
      }
    });

    observer.observe(mainContentElement, { childList: true, subtree: true });

    // Handle scroll events
    window.addEventListener('scroll', () => {
      clearTimeout(observer.scrollTimeout);
      observer.scrollTimeout = setTimeout(callback, 1000);
    });

  } else {
    console.error('Could not find main content element to observe');
  }
}


function onContentLoaded() {
  setTimeout(analyzeTweets, 2500); // Wait for 3 seconds before running analyzeTweets
  observeTweets(analyzeTweets);
  handleScroll(analyzeTweets);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onContentLoaded);
} else {
  onContentLoaded();
}