// edited code from https://codesandbox.io/p/sandbox/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-choropleth-map?file=%2Fjs%2FchoroplethMap.js
class chloropeth 
{
    constructor(_config, _attributeName, _num, _geoData) 
    {
        // Set the configuration options for the visualization
        this.config = 
        {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 15, right: 15, bottom: 15, left: 5},
            color: attr[_attributeName].color,
            legendBottom: 20,
            legendLeft: 50,
            legendRectHeight: 12,
            legendRectWidth: 300,
        };
        this.us = _geoData;
        this.number = _num;
        this.attributeName = _attributeName;

        // Initialize the visualization
        this.initVis();
    }
// Initialize the visualization
initVis() 
{
    let vis = this;

    // Calculate translateX value based on parent width
    const parentWidth = d3.select(vis.config.parentElement).node().getBoundingClientRect().width;
    const translateX = (parentWidth - vis.config.containerWidth) / 2;

    // Calculate the inner chart size based on the margins in the chart
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append("svg").attr("width", vis.config.containerWidth).attr("height", vis.config.containerHeight);

    // Create main chart group
    vis.chart = vis.svg.append("g").attr("transform",`translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Set up map projection from https://github.com/topojson/us-atlas
    vis.projection = d3.geoAlbersUsa().translate([vis.width / 2, vis.height / 2]).scale(vis.width);

    // Create path generator
    vis.path = d3.geoPath().projection(vis.projection);

    // Create group for drawing map features
    vis.g = vis.svg.append("g").attr("transform","translate(" +vis.config.margin.left +"," +vis.config.margin.top +")")
        .attr("height",vis.height + vis.config.margin.top + vis.config.margin.bottom
        )
        .attr("width",vis.width + vis.config.margin.left + vis.config.margin.right);

    // Draw state borders
    vis.svg.append("g").datum(topojson.mesh(vis.us, vis.us.objects.states, (a, b) => a !== b)).attr("id", "state-borders").attr("d", vis.path).attr("transform","translate(" + vis.config.margin.left +"," +vis.config.margin.top +")");

    // Append legend
    vis.legend = vis.chart.append("g").attr("transform",`translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);

    // Append linear gradient definition for legend
    vis.linearGradient = vis.svg.append("defs").append("linearGradient").attr("id", `legend-gradient-${vis.number}`);

    // Create legend rectangle
    vis.legendRect = vis.legend.append("rect").attr("width", vis.config.legendRectWidth).attr("height", vis.config.legendRectHeight);

    // Create brush group
    vis.brushG = vis.g.append("g").attr("class", "brush");

    // Define brush behavior
    vis.brush = d3.brush()
    .extent([
            [0, 0],
            [vis.config.containerWidth, vis.config.containerHeight],
            ])
        // Reset the filtered counties
        .on("start", () => (filteredCounties = [])).on("end", (result) => vis.SelectCounties(result, vis));

    // Create grouped counties group
    vis.groupedCounties = vis.g.append("g").attr("id", "counties");

    // Update the visualization
    this.updateVis();
}

// Update the visualization
updateVis() {
    const vis = this;

    // Update color scale domain based on attribute data
    vis.config.color = attr[vis.attributeName].color;

    // Filter data based on the attribute
    const filteredData = geoData.objects.counties.geometries.filter(
        (d) => d.properties[vis.attributeName] != -1
    );

    // Create legend title
    vis.legendTitle = vis.legend.selectAll(".legend-title").data([vis.attributeName]).join("text").attr("class", "legend-title").attr("dy", ".35em")
        .attr("y", -10).text(attr[vis.attributeName].label).style("display",vis.attributeName === "urban_rural_status" ? "none" : "block");

    // Calculate attribute extent
    const attributeExtent = d3.extent(
        filteredData,
        (d) => d.properties[vis.attributeName]
    );

    // Create color scale based on attribute type
    if (vis.attributeName === "urban_rural_status") {
        vis.colorScale = d3.scaleOrdinal().domain(["Rural", "Small City", "Suburban", "Urban"]).range(['lightgrey', '#FFD700', '#87CEEB', '#FF6347']);
    } else {
        vis.colorScale = d3.scaleLinear().domain(attributeExtent).range(["#ffffff", vis.config.color]).interpolate(d3.interpolateHcl);
    }

    // Draw counties on the map
    vis.counties = vis.groupedCounties
        .selectAll("path").data(
            topojson.feature(vis.us, vis.us.objects.counties).features
        )
        .join("path").attr("d", vis.path).attr("fill", (d) => {
            const coloredOrStripe =
    d.properties[vis.attributeName] != -1
        ? vis.colorScale(d.properties[vis.attributeName])
        : 'url(#lightstripe)';

            return filteredCounties.length !== 0
                ? filteredCounties.find(
                        (filteredCounty) => filteredCounty == d.properties.cnty_fips
                    )
                    ? coloredOrStripe
                    : "#f0f0f0"
                : coloredOrStripe;
                
        });

    // Create legend stops
    vis.legendStops = [
        {
            color: "white",
            value: attributeExtent[0],
            offset: 0,
        },
        {
            color: vis.config.color,
            value: attributeExtent[1],
            offset: 100,
        },
    ];

    // Append legend color squares
    vis.legend
        .selectAll("rect.choroplethColor").data(["Rural", "Small City", "Suburban", "Urban"]).join("rect").attr("class", "choroplethColor")
        .attr("width", 18).attr("height", 18).style("fill", (d) => vis.colorScale(d)).style("stroke", (d) => vis.colorScale(d))
        .attr("transform",(d, index) => `translate(${vis.config.margin.left + index * 100},${0})`
        )
        .style("display",vis.attributeName === "urban_rural_status" ? "block" : "none");

    // Append legend color labels
    vis.legend
        .selectAll("text.choroplethColorLabel").data(["Rural", "Small City", "Suburban", "Urban"]).join("text").attr("class", "choroplethColorLabel").attr("x", 22)
        .attr("y", 14).text((d) => d).attr("transform",(d, index) => `translate(${vis.config.margin.left + index * 100},${0})`)
        .style("display",vis.attributeName === "urban_rural_status" ? "block" : "none");

    // Add legend labels
    vis.legend.selectAll(".legend-label").data(vis.legendStops).join("text").attr("class", "legend-label").attr("text-anchor", "middle")
        .attr("dy", ".35em").attr("y", 20).attr("x", (d, index) => 
        {
            return index == 0 ? 0 : vis.config.legendRectWidth;
        })
        .text((d) => Math.round(d.value * 10) / 10)
        .style("display",vis.attributeName === "urban_rural_status" ? "none" : "block");

    // Update gradient for legend
    vis.linearGradient.selectAll("stop").data(vis.legendStops).join("stop").attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color).style("display",vis.attributeName === "urban_rural_status" ? "none" : "block");

    // Apply gradient to legend rectangle
    vis.legendRect.attr("fill", `url(#legend-gradient-${vis.number})`).style("display",vis.attributeName === "urban_rural_status" ? "none" : "block");

    // Call brush function
    vis.brushG.call(vis.brush);
}

// Method to select counties based on brush selection
SelectCounties(result, vis) {
    if (!result.sourceEvent) return; 

    const extent = result.selection;

    if (!extent) {
      filteredCounties = [];
    } else {
      filteredCounties = topojson
        .feature(vis.us, vis.us.objects.counties)
        .features.filter((d) => {
          const boundingBox = vis.path.bounds(d);
          const xMin = boundingBox[0][0];
          const yMin = boundingBox[0][1];
          const xMax = boundingBox[1][0];
          const yMax = boundingBox[1][1];

          return (
            xMax >= extent[0][0] &&
            xMin <= extent[1][0] &&
            yMax >= extent[0][1] &&
            yMin <= extent[1][1]
          );
        })
        .map((d) => d.properties.cnty_fips);
    }

    // Call function to update visualizations
    updateVisualizations(vis);
  }

}