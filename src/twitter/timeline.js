const timeline = async (user) => {
	const res = await app.Got({
		url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${user}`,
		responseType: "text"
	});

	const html = res.body;

	const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/;
	const timelineData = JSON.parse(html.match(regex)[1]);
	const timeline = timelineData.props.pageProps.timeline.entries;

	const entries = timeline
		.map(i => i?.content?.tweet)
		.filter(Boolean)
		.filter(i => !i?.quotedTweetTombstoneInfo);

	return {
		success: true,
		entries
	};
};

module.exports = timeline;
