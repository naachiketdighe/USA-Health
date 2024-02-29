// This class contains code for both histogram and bar chart
class combinedChart {

    // Constructor function to initialize the class
    constructor(_config, _attributeName, _num, _HistBar) {
        // Initialize configuration parameters
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 200,
            margin: { top: 25, bottom: 45, right: 25, left: 45 },
        };
        this.attributeName = _attributeName;
        this.number = _num;
        this.HistBar = _HistBar; // 'barchart' or 'histogram'
        this.urban_suburban = ["Rural", "Small City", "Suburban", "Urban"]; // Define urban_suburban array

        this.initVis(); // Initialize the visualization
    }

    // Function to initialize the visualization
    initVis() {
        const vis = this;

        // Get the width of the parent element
        const parentWidth = d3.select(vis.config.parentElement).node().getBoundingClientRect().width;

        // Create an SVG element and append it to the parent element
        vis.svg = d3.select(vis.config.parentElement).append("svg")
            .attr( "width",vis.config.containerWidth +vis.config.margin.left +vis.config.margin.right
            )
            .attr("height",vis.config.containerHeight +vis.config.margin.top +vis.config.margin.bottom
            )
            .append("g")
            .attr("transform",`translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        // Create x and y scales
        vis.x = d3.scaleLinear().range([0, vis.config.containerWidth]);
        vis.xAxis = vis.svg.append("g").attr("transform", `translate(0,${vis.config.containerHeight})`);

        vis.y = d3.scaleLinear().range([vis.config.containerHeight, 0]);
        vis.yAxis = vis.svg.append("g");

        // Add y-axis label
        vis.svg.append("text").attr("transform", "rotate(-90)").attr("y", 0 - vis.config.margin.left).attr("x", 0 - vis.config.containerHeight / 2).attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Counties");

        // Add x-axis label
        vis.svg.selectAll("text.xLabel").data([vis.attributeName]).join("text").attr("class", "xLabel")
            .attr(
                "transform",
                "translate(" +
                vis.config.containerWidth / 2 +
                " ," +
                (vis.config.containerHeight + 35) +
                ")"
            )
            .style("text-anchor", "middle")
            .text(attr[vis.attributeName].label);

        vis.brushG = vis.svg.append("g").attr("class", "brush");

        vis.brush = d3
            .brushX()
            .extent([
                [0, 0],
                [vis.config.containerWidth, vis.config.containerHeight],
            ])
            // Reset the filtered counties
            .on("start", () => (filteredCounties = []))
            .on("end", (result) => vis.selectCounties(result, vis));

        this.updateVis(); // Update the visualization
    }

    // Function to update the visualization
    updateVis() {
        const vis = this;
        vis.brushG.call(vis.brush); // Call the brush function


        // Filter the data based on the selected counties
        vis.data = countiesData.filter(
            (d) =>
                d[vis.attributeName] != -1 &&
                (filteredCounties.length == 0 ||
                    (filteredCounties.length != 0 &&
                        filteredCounties.find(
                            (filteredCounty) => filteredCounty == d.cnty_fips
                        )))
        );

        // Update the x-axis scale and call the x-axis
        vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attributeName])]);
        vis.xAxis.call(d3.axisBottom(vis.x));

        // Update the x-axis label
        vis.svg
            .selectAll("text.xLabel")
            .text(attr[vis.attributeName].label);

        vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attributeName])]);
        vis.xAxis.call(d3.axisBottom(vis.x));

        if (vis.HistBar === 'histogram') {
            // Create a histogram and calculate the bins
            const histogram = d3
                .histogram()
                .value((d) => d[vis.attributeName])
                .domain(vis.x.domain())
                .thresholds(vis.x.ticks(50));

            const bins = histogram(vis.data);

            // Update the y-axis scale and call the y-axis
            vis.y.domain([0, d3.max(bins, (d) => d.length)]);
            vis.yAxis.call(d3.axisLeft(vis.y));

            // Update the histogram bars
            vis.svg
                .selectAll(`rect.bar-${vis.number}`)
                .data(bins)
                .join("rect")
                .attr("class", `bar-${vis.number}`)
                .attr("x", 1)
                .attr(
                    "transform",
                    (d) => `translate(${vis.x(d.x0)}, ${vis.y(d.length)})`
                )
                .attr("width", (d) => vis.x(d.x1) - vis.x(d.x0))
                .attr("height", (d) => vis.config.containerHeight - vis.y(d.length))
                .style("fill", attr[vis.attributeName].color);
        } else if (vis.HistBar === 'barchart') {
            // Calculate the counts for each status type
            let statusCounts = [0, 0, 0, 0];
            vis.data.forEach(
                (county) =>
                    statusCounts[vis.urban_suburban.indexOf(county[vis.attributeName])]++
            );

            // Update the y-axis scale and call the y-axis
            vis.y.domain([0, Math.max(...statusCounts)]);
            vis.yAxis.call(d3.axisLeft(vis.y));

            const bar_width = vis.config.containerWidth / vis.urban_suburban.length;
            // Update the bar chart bars
            vis.svg
                .selectAll("rect.barchart-bar")
                .data(statusCounts)
                .join("rect")
                .attr("class", "barchart-bar")
                .attr("x", (index) => index * bar_width)
                .attr("y", (d) => vis.y(d))
                .attr("width", bar_width)
                .attr("height", (d) => vis.config.containerHeight - vis.y(d))
                .style("fill", attr[vis.attributeName].color);
        }
    }

    // Function to filter the data based on the selection
    selectCounties(result, vis) {
        if (!result.sourceEvent) return;

        const extent = result.selection;

        if (!extent) {
            filteredCounties = [];
        } else {
            if (vis.HistBar === 'histogram') {
                const range = [vis.x.invert(extent[0]), vis.x.invert(extent[1])];

                filteredCounties = countiesData
                    .filter((d) => {
                        const attrVal = d[vis.attributeName];
                        return attrVal >= range[0] && attrVal <= range[1];
                    })
                    .map((d) => d.cnty_fips);
            } else if (vis.HistBar === 'barchart') 
            {

                const brushStart = extent[0];
                const brushEnd = extent[1];
                const bandwidth = vis.x.bandwidth();
                const filteredStatuses = [];
                vis.urban_suburban.forEach((type) => {
                    const barStart = vis.x(type);

                    const barEnd = barStart + bandwidth;

                    if (barEnd >= brushStart && barStart <= brushEnd)
                        filteredStatuses.push(type);
                });

                filteredCounties = countiesData
                    .filter((d) => filteredStatuses.includes(d[vis.attributeName]))
                    .map((d) => d.cnty_fips);
            }
        }

        updateVisualizations(vis); // Update the visualizations
        vis.brushG.call(vis.brush.move, null); // Reset the brush selection
    }

};
