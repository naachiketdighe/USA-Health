// Define a class named Scatterplot
class Scatterplot {
    constructor(_config, _attributeName1, _attributeName2) {
        // Configuration options for the scatterplot
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 200,
            margin: { top: 20, bottom: 50, right: 50, left: 65 },
        };
        // Names of the attributes used for x and y axes
        this.attributeName1 = _attributeName1;
        this.attributeName2 = _attributeName2;

        // Initialize the scatterplot visualization
        this.initVis();
    }

    // Initialize the scatterplot visualization
    initVis() {
        const vis = this;

        // Create the SVG container for the scatterplot
        vis.svg = d3
            .select(vis.config.parentElement)
            .append("svg")
            .attr(
                "width",
                vis.config.containerWidth +
                vis.config.margin.left +
                vis.config.margin.right
            )
            .attr(
                "height",
                vis.config.containerHeight +
                vis.config.margin.top +
                vis.config.margin.bottom
            )
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left}, ${vis.config.margin.top})`
            );

        // Create the y-axis scale and axis
        vis.y = d3.scaleLinear().range([vis.config.containerHeight, 0]);
        vis.yAxis = vis.svg.append("g");

        // Create the x-axis scale and axis
        vis.x = d3.scaleLinear().range([0, vis.config.containerWidth]);
        vis.xAxis = vis.svg
            .append("g")
            .attr("transform", `translate(0,${vis.config.containerHeight})`);

        // Create the brush for selection
        vis.brushG = vis.svg.append("g").attr("class", "brush");

        vis.brush = d3
            .brush()
            .extent([
                [0, 0],
                [vis.config.containerWidth, vis.config.containerHeight],
            ])
            .on("start", () => (filteredCounties = []))
            .on("end", (result) => vis.SelectCounties(result, vis));

        // Update the scatterplot visualization
        this.updateVis();
    }

    // Update the scatterplot visualization
    updateVis() {
        const vis = this;

        // Call the brush function
        vis.brushG.call(vis.brush);

        // Filter the data based on attribute values
        vis.data = countiesData.filter(
            (d) => d[vis.attributeName1] != -1 && d[vis.attributeName2] != -1
        );

        // Update the x-axis scale and axis
        vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attributeName2])]);
        vis.xAxis.call(d3.axisBottom(vis.x));

        // Update the y-axis scale and axis
        vis.y.domain([0, d3.max(vis.data, (d) => d[vis.attributeName1])]);
        vis.yAxis.call(d3.axisLeft(vis.y));

        // Add y-axis label
        vis.svg
            .selectAll("text.yLabel")
            .data([vis.attributeName1])
            .join("text")
            .attr("class", "yLabel")
            .attr("transform", "rotate(-90)")
            .attr(
                "y",
                0 - vis.config.margin.left
            )
            .attr("x", 0 - vis.config.containerHeight / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(attr[vis.attributeName1].label);

        // Add x-axis label
        vis.svg
            .selectAll("text.xLabel")
            .data([vis.attributeName2])
            .join("text")
            .attr("class", "xLabel")
            .attr(
                "transform",
                "translate(" +
                vis.config.containerWidth / 2 +
                " ," +
                (vis.config.containerHeight + 35) +
                ")"
            )
            .style("text-anchor", "middle")
            .text(attr[vis.attributeName2].label);

    // Select all circles with class 'regularPoint', bind data, and create/update circles
vis.svg.selectAll("circle.regularPoint")
.data(vis.data)
.join("circle")
.attr("class", "regularPoint")
.attr("cx", (d) => vis.x(d[vis.attributeName2])) // Set x-coordinate
.attr("cy", (d) => vis.y(d[vis.attributeName1])) // Set y-coordinate
.attr("r", 3) // Set circle radius
.style("fill", (d) => { // Set fill color based on attribute colors
    const fillColor = `color-mix(in srgb, ${attr[vis.attributeName1].color}, ${attr[vis.attributeName2].color}`;
    return fillColor;
})
.style("fill-opacity", (d) => { // Set fill opacity based on filtered counties
    if (filteredCounties.length !== 0) {
        if (filteredCounties.find((filteredCounty) => filteredCounty == d.cnty_fips))
            return 1;
        else
            return 0.1;
    } else
        return 1;

});

}


    // Method to select counties based on brush selection
    SelectCounties(result, vis) {
        if (!result.sourceEvent) return;

        const extent = result.selection;

        if (!extent) {
            filteredCounties = [];
        } else {
            // Filter the counties
            const xRange = [vis.x.invert(extent[0][0]), vis.x.invert(extent[1][0])];
            const yRange = [vis.y.invert(extent[1][1]), vis.y.invert(extent[0][1])];

            filteredCounties = countiesData
                .filter((d) => {
                    const attr1Val = d[vis.attributeName1];
                    const attr2Val = d[vis.attributeName2];

                    return (
                        attr1Val >= yRange[0] &&
                        attr1Val <= yRange[1] &&
                        attr2Val >= xRange[0] &&
                        attr2Val <= xRange[1]
                    );
                })
                .map((d) => d.cnty_fips);
        }

        // Call function to update visualizations
        updateVisualizations(vis);
    }
}
