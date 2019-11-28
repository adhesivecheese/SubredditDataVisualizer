window.onload = function() {
	document.getElementById('daysRange').addEventListener("input", function() {
		var daysOfHist = document.getElementById('daysRange').value;
		document.getElementById('daysToGet').innerHTML = daysOfHist + " Days";
	});
	document.getElementById('usersRange').addEventListener("input", function() {
		var numOfUsers = document.getElementById('usersRange').value;
		document.getElementById('usersToGet').innerHTML = numOfUsers + " Users";
	});
	var coll = document.getElementsByClassName("collapsible");
	var i;
	for (i = 0; i < coll.length; i++) {
		coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.display === "block") { content.style.display = "none"; }
			else { content.style.display = "block"; }
		});
	}
	google.charts.load('current', { 'packages': ['corechart', 'bar', 'line'] });
	google.charts.setOnLoadCallback(drawLineChart);
	
	var subreddit = "DirtyPenPals";
	var numOfDays = 30;
	var numOfSubmissions = 25;
	
	async function getTotalsData(dataToFetch, docID, timeID) {
		let response = await
		fetch("https://api.pushshift.io/reddit/" + dataToFetch + "/search/?subreddit=" + subreddit + "&aggs=subreddit&frequency=day&after=" + numOfDays + "d&size=0");
		let data = await response.json();
		document.getElementById(docID).innerHTML = Number(data.aggs.subreddit[0].doc_count).toLocaleString();
		var timeBetwen = ((86300 * numOfDays) / Number(data.aggs.subreddit[0].doc_count));
		var date = new Date(null);
		date.setSeconds(timeBetwen);
		var timeString = date.toISOString().substr(11, 8);
		document.getElementById(timeID).innerHTML = timeString;
	}
	async function getAggData(dataToFetch) {
		let response = await
		fetch("https://api.pushshift.io/reddit/" + dataToFetch + "/search/?subreddit=" + subreddit + "&aggs=created_utc&frequency=day&after=" + numOfDays + "d&size=0");
		let data = await response.json()
		return data.aggs.created_utc;
	}
	async function getAuthorData(dataToFetch) {
		let response = await
		fetch("https://api.pushshift.io/reddit/" + dataToFetch + "/search/?subreddit=" + subreddit + "&aggs=author&frequency=day&after=" + numOfDays + "d&size=0");
		let data = await response.json();
		return data.aggs.author;
	}
	async function getAggChart() {
		const posts = await getAggData("submission");
		const comments = await getAggData("comment");
		var visArrayData = Array();
		for (var i = 1; i < posts.length; i++) {
			if (posts[i].key == comments[i].key) {
				var dateString = new Date(posts[i].key * 1000 + 86400000).toDateString();
				visArrayData.push([dateString, posts[i].doc_count, comments[i].doc_count]);
			}
		}
		drawLineChart(visArrayData)
	}
	async function getCommentChart() {
		dataType = await getAuthorData("comment");
		var count = 5;
		var removed = 0;
		for (var i = 0; i < count; i++) {
			if (dataType[i].key === '[deleted]' || dataType[i].key === 'AutoModerator') {
				count = count + 1;
				removed = removed + 1;
			}
			else {
				var docID = "comments" + (i - removed);
				document.getElementById(docID).innerHTML = "<a href='https://reddit.com/u/" + dataType[i].key + "'>" + dataType[i].key + "</a>"
			}
		}
		prepareUserData(dataType, "Comments", "comments");
	}
	async function getSubmissionChart() {
		dataType = await getAuthorData("submission");
		for (var i = 0; i < 5; i++) {
			var docID = "posts" + i;
			document.getElementById(docID).innerHTML = "<a href='https://reddit.com/u/" + dataType[i].key + "'>" + dataType[i].key + "</a>"
		}
		prepareUserData(dataType, "Submissions", "submissions")
	}

	function prepareUserData(data, chartType, divToUse) {
		var visArrayData = Array();
		var removals = 0;
		for (var i = 0; i < (numOfSubmissions + removals); i++) {
			if (dataType[i].key === '[deleted]') {
				removals = removals + 1;
			} else { visArrayData.push([dataType[i].key, dataType[i].doc_count]); }
		}
		console.log(visArrayData);
		drawBarChart(visArrayData, chartType, divToUse);
	}

	function drawLineChart(postsData) {
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Day');
		data.addColumn('number', 'Posts');
		data.addColumn('number', 'Comments');
		data.addRows(postsData);
		var options = {
			chart: {
				title: 'Posts and Comments on ' + subreddit + ' for Last ' + numOfDays + ' Days',
				subtitle: 'data from Pushshift'
			},
			backgroundColor: '#f2f2f2',
			vAxis: { format: 'decimal' },
			axes: { x: { 0: { label: '' } } }
		};
		var chart = new google.charts.Line(document.getElementById('aggregate'));
		chart.draw(data, google.charts.Line.convertOptions(options));
	}

	function drawBarChart(postsData, chartType, divToUse) {
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'User');
		data.addColumn('number', 0);
		data.addRows(postsData);
		var materialOptions = {
			legend: {
				position: 'none'
			},
			chart: {
				title: "Highest number of " + chartType + ' on ' + subreddit + ' for Last ' + numOfDays + ' Days',
				subtitle: 'data from Pushshift',
				style: { background: { fillColor: '#f2f2f2' } }
			},
			bars: 'horizontal',
			colors: ['#0DD3BB'],
			backgroundColor: '#f1f8e9',
			axes: {
				x: { 0: { side: 'top'  } },
				y: { 0: { side: 'left' } }
			}
		};
		var materialChart = new google.charts.Bar(document.getElementById(divToUse));
		materialChart.draw(data, materialOptions);
	}
	getTotalsData("submission", "totPost", "timePost");
	getTotalsData("comment", "totComment", "timeComment");
	getAggChart();
	getCommentChart();
	getSubmissionChart();
};