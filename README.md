# senTweet
 A chrome extension for Twitter enhanced with **Sentiment Analysis** . It classifies sentiment of tweets and give corresponding Emojis next to tweets. See the demonstration in the screenshot below.
 
 # Demonstration
 ![image](https://user-images.githubusercontent.com/18302400/230457004-94b8b497-c49e-4225-b408-2d003640041c.png)

 
# Technologies used
JavaScript, Python, Flask, AWS, Postman, HTML, CSS 

[![My Skills](https://skillicons.dev/icons?i=js,py,flask,aws,postman,html,css&perline=10)](https://skillicons.dev)

# How to install and use this extension?
1. download source code of the **chrome-extension** folder to your machine. You don't need the whole repo to make it work.
2. open up `chrome://extensions/` with Chrome
3. switch on `Developer mode` <img width="165" alt="image" src="https://user-images.githubusercontent.com/18302400/215185985-7dd56661-0c8a-4d51-a5be-5a08d4de15e9.png">
4. click on `Load unpacked` and select the foler of source code <img width="382" alt="image" src="https://user-images.githubusercontent.com/18302400/215186131-933d24bf-39ac-4d82-a078-cbf271370e99.png">
5. Done! After loading this extension to your chrome browser, go to Twitter and login with your account. Then, you should use the emojis representing sentiments next to each tweet.

# Note
1. Tweets have no timestamp will not have a sentiment emoji becauese the emojis are supposed add to time stamps. Will change this in future.
2. Tweets with retweets may have two generated emojis.
3. Let me know if this extension is down, it's probably due to the AWS api issue.
