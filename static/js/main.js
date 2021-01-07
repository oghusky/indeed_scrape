console.log(window.location.pathname)
if (window.location.pathname === "/") {
  d3
    .json("/jobs")
    .then(data => {
      const dataset = data.data;
      const shead = d3.select("#salary thead");
      const sbody = d3.select("#salary tbody");
      const dhead = d3.select("#mention_data thead");
      const dbody = d3.select("#mention_data tbody");
      shead.html(`
      <th scope="col">Job Title</th>
      <th scope="col">Company Name</th>
      <th scope="col">Salary</th>
      <th scope="col">Job Summary</th>
      `);
      sbody
        .selectAll("tr")
        .data(dataset)
        .enter()
        .append("tr")
        .html(function (item) {
          if (item.salary !== "None") {
            return `
            <td>${item.title}</td>
            <td>${item.company}</td>
            <td>${item.salary === "None" ? "Salary Not provided" : item.salary}</td>
            <td>${item.summaries.join(",")}</td>
            `
          }
        })
      dhead.html(`
      <th scope="col">Job Title</th>
      <th scope="col">Company Name</th>
      <th scope="col">Job Summary</th>
      `);
      dbody
        .selectAll("tr")
        .data(dataset)
        .enter()
        .append("tr")
        .html(function (item, i) {
          if (item.title.includes("Data Engineer") && i < 50) {
            return `
            <td>${item.title}</td>
            <td>${item.company}</td>
            <td>${item.summaries.join(",")}</td>
            `
          }
        })
    })
}

if (window.location.pathname === "/keywords") {
  d3
    .json("/summaries")
    .then(data => {
      console.log(data);
      const counts = data.counts;
      const cleaned = data.cleaned_words;
      const raw = data.raw_words;
      const sorted_counts = counts.sort((a, b) => b.count - a.count).slice(0, 10);
      const text_content = d3.select("#text-content")
      const thead = d3.select("thead");
      const tbody = d3.select("tbody");
      thead.html(`
        <th scope="col">Word</th>
        <th scope="col">Count</th>
        <th scope="col">% VS Clean Data</th>
        <th scope="col">% VS Raw Data</th>
      `)
      tbody
        .selectAll("tr")
        .data(sorted_counts)
        .enter()
        .append("tr")
        .html(function (item) {
          return `
          <td>${item.word.toUpperCase()}</td>
          <td>${item.count}</td>
          <td>${(item.count / cleaned.length * 100).toFixed(4)}%</td>
          <td>${(item.count / raw.split(" ").length * 100).toFixed(4)}%</td>
          `
        })
      text_content.html(`
        <p>The table below consists of the top 10 words used in Job Summaries for Data Engineers, in Atlanta, GA
        according to <a href="https://www.indeed.com"><b>Indeed.com</b></a>. In short, from <b>${cleaned.length}</b>
        summaries scraped from Indeed the words listed below are the most frequently used.</p>
        
        <p><b>${sorted_counts[0].word.toUpperCase()}</b> appears as the most frequently used word, with a count of 
        <b>${sorted_counts[0].count}</b></p>
      `)
    })
}

if (window.location.pathname === "/charts") {
  d3
    .json("/summaries")
    .then(data => {
      console.log(data)
      // bar chart
      const high_counts = data.counts.sort((a, b) => b.count - a.count).slice(0, 10);
      const bar = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: high_counts
        },
        mark: "bar",
        encoding: {
          x: { field: "word", type: "nominal" },
          y: {
            aggregate: "average",
            field: "count",
            type: "quantitative",
            axis: {
              title: "Words with most frequency"
            }
          }
        }
      };
      vegaEmbed("#bar-chart-high", bar)

      // pie chart
      const pie = {
        $schema: "https://vega.github.io/schema/vega-lite/v4.json",
        description: "A simple radial chart with embedded data.",
        data: {
          values: high_counts
        },
        layer: [{
          mark: { type: "arc", innerRadius: 20, stroke: "#fff" }
        }, {
          mark: { type: "text", radiusOffset: 10 },
          encoding: {
            text: { field: "count", type: "quantitative" }
          }
        }],
        encoding: {
          theta: { field: "count", "type": "quantitative", "stack": true },
          radius: { field: "count", "scale": { "type": "sqrt", "zero": true, "rangeMin": 20 } },
          color: { field: "word", "type": "nominal", "legend": null }
        },
        view: { stroke: null }
      }
      vegaEmbed("#pie-chart-high", pie)

      // scatter plot
      const scatter = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
        "data": { values: data.useless },
        "mark": "point",
        "encoding": {
          "x": { "field": "str_length", "type": "quantitative" },
          "y": { "field": "count", "type": "quantitative" }
        }
      }
      vegaEmbed("#count-useless-words", scatter)
    })
}