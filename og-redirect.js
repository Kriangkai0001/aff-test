app.get('/post/:id', async (req, res) => {
  const post = await getPostFromDB(req.params.id);
  const userAgent = req.headers['user-agent'];
  const isFacebookBot = /facebookexternalhit|Facebot|Twitterbot|Slackbot/.test(userAgent);

  if (isFacebookBot) {
    res.send(`
      <html>
        <head>
          <meta property="og:title" content="${post.caption}">
          <meta property="og:description" content="${post.caption}">
          <meta property="og:image" content="${post.image_url}">
          <meta property="og:url" content="https://yourdomain.com/post/${post.id}">
        </head>
        <body></body>
      </html>
    `);
  } else {
    res.redirect(post.affiliate_link);
  }
});