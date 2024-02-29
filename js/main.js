let filteredCounties;
let geoData;
let countiesData;
let scatterplot;
let choropleth1;
let choropleth2;
let hist1;
let hist2;
let bar1;
let bar2;
let updateVisualizations;

let attributeSelect1 = "poverty_perc"
let attributeSelect2 = "median_household_income"


const attr = {
    poverty_perc: { label: "Poverty %", color: "#FFD700" }, // light orange
    median_household_income: { label: "Median Household Income $", color: "#90EE90" }, // light green
    education_less_than_high_school_percent: { label: "Education Less Than High School %", color: "#FF5733" }, // light purple
    air_quality: { label: "Air Quality", color: "#ADD8E6" }, // light blue
    park_access: { label: "Park Access", color: "#367d3e" }, // dark green
    percent_inactive: { label: "Inactive %", color: "#FFC0CB" }, // light pink
    percent_smoking: { label: "Smoking %", color: "#D3D3D3" }, // light grey
    urban_rural_status: { label: "Urban/Rural Status", color: "#FFFFE0" }, // light yellow
    elderly_percentage: { label: "Elderly", color: "#E6E6FA" }, // light lavender
    number_of_hospitals: { label: "Number of Hospitals", color: "#E0FFFF" }, // light cyan
    number_of_primary_care_physicians: { label: "Number of Primary Care Physicians", color: "#7FFFD4" }, // light aqua
    percent_no_heath_insurance: { label: "No Health Insurance", color: "#FFA07A" }, // light red
    percent_high_blood_pressure: { label: "High Blood Pressure", color: "#F08080" }, // light coral
    percent_coronary_heart_disease: { label: "Coronary Heart Disease", color: "#FFA07A" }, // light salmon
    percent_stroke: { label: "Stroke %", color: "#FF7377" }, // light red
    percent_high_cholesterol: { label: "High Cholesterol %", color: "#FF5733" } // light sky blue
};



Promise.all([
    d3.json("./data/counties-10m.json"),
    d3.csv("./data/national_health_data.csv"),

]).then((data) => {
    countiesData = data[1];
    geoData = data[0];

    console.log(countiesData)
    console.log(geoData)

    const attrAvailable = Object.keys(countiesData[0]);


    // cleaning the data unless the attr is urban_rural_status
    countiesData.forEach((d) => {
        attrAvailable.forEach((attribute) => {
          if (attribute === "display_name")
          newVal = d[attribute].replace(/[()"]/g, "");

          else if (attribute === "urban_rural_status") newVal = d[attribute];
          else newVal = +d[attribute];
          d[attribute] = newVal;
        });
      });

      // combine the data for chloropeth map
      geoData.objects.counties.geometries.forEach((geo) => {
        countiesData.forEach((county) => {
          // If the IDs match, add all of the attributes data
          if (geo.id == county.cnty_fips) {
            attrAvailable.forEach((attribute) => {
              geo.properties[attribute] = county[attribute];
            });
          }
        });
      });

    const attributeSelect1 = document.getElementById("attributeSelect1");
    const attributeSelect2 = document.getElementById("attributeSelect2");

    Object.entries(attr).forEach((attribute, index) => {
        // Add all of the options to the 2 attribute selectors
        const opt1 = document.createElement("option");
        const opt2 = document.createElement("option");
        opt1.value = opt2.value = attribute[0];
        opt1.text = opt2.text = attribute[1].label;
        attributeSelect1.add(opt1);
        attributeSelect2.add(opt2);

        if (index == 1) attributeSelect2.value = attribute[0];
    });

    filteredCounties = [];

      hist1 = new combinedChart(
        {
          parentElement: "#hist1",
        },
        attributeSelect1.value,
        1, "histogram"
      );
      hist2 = new combinedChart(
        {
          parentElement: "#hist2",
        },
        attributeSelect2.value,
        2,  "histogram"
      );
      bar1 = new combinedChart({ parentElement: "#bar1" },  attributeSelect1.value,
      1, "barchart");
      bar2 = new combinedChart({ parentElement: "#bar2" }, attributeSelect2.value,
      2,  "barchart");

      scatterplot = new Scatterplot(
        {
          parentElement: "#scatterplot",
        },
        attributeSelect1.value,
        attributeSelect2.value
      );

      choropleth1 = new chloropeth(
        {
          parentElement: "#choropleth1",
        },
        attributeSelect1.value, 
        1, geoData
      );
      choropleth2 = new chloropeth(
        {
          parentElement: "#choropleth2",
        },
        attributeSelect2.value,
        2, geoData
      );

      updateVisualizations = (currentVis) => {
        const selectedAttr1 = attributeSelect1.value;
        const selectedAttr2 = attributeSelect2.value;
  
        if (selectedAttr1 === "urban_rural_status") bar1.updateVis();
        if (selectedAttr2 === "urban_rural_status") bar2.updateVis();
        if (selectedAttr1 !== "urban_rural_status") hist1.updateVis();
        if (selectedAttr2 !== "urban_rural_status") hist2.updateVis() 
        if (
          selectedAttr1 !== "urban_rural_status" ||
          selectedAttr2 !== "urban_rural_status"
        )
        scatterplot.updateVis()
        choropleth1.updateVis()
        choropleth2.updateVis();
    
  
        hist1.brushG.call(hist1.brush.move, null);
        hist2.brushG.call(hist2.brush.move, null);
        if (currentVis != bar1)
          bar1.brushG.call(bar1.brush.move, null);
        if (currentVis != bar2)
          bar2.brushG.call(bar2.brush.move, null);
        if (currentVis != scatterplot)
          scatterplot.brushG.call(scatterplot.brush.move, null);
        if (currentVis != choropleth1)
          choropleth1.brushG.call(choropleth1.brush.move, null);
        if (currentVis != choropleth2)
          choropleth2.brushG.call(choropleth2.brush.move, null);
      };    
    
    const handleAttributeSelectChange = (event, attributeSelect) => {
      const selectedAttr = event.target.value;
      const selectedAttr2 = attributeSelect === 1 ? attributeSelect2.value : attributeSelect1.value; // Get the value of the other attribute select
      const histogramElement = document.getElementById(`hist${attributeSelect}`);
      const barchartElement = document.getElementById(`bar${attributeSelect}`);
      const scatterplotElement = document.getElementById("scatterplot");
  
      if (selectedAttr === "urban_rural_status") {
          histogramElement.style.display = "none";
          barchartElement.style.display = "block";
          scatterplotElement.style.display = "none";
      } else {
          histogramElement.style.display = "block";
          barchartElement.style.display = "none";
          scatterplotElement.style.display = "block";
      }
  
      const hist = attributeSelect === 1 ? hist1 : hist2;
      hist.attributeName = selectedAttr;
  
      // Update attribute name for scatterplot based on which attribute select is being changed
      if (attributeSelect === 1) {
          scatterplot.attributeName1 = selectedAttr;
      } else {
          scatterplot.attributeName2 = selectedAttr;
      }
  
      // Update attribute name for choropleth based on which attribute select is being changed
      const choropleth = attributeSelect === 1 ? choropleth1 : choropleth2;
      choropleth.attributeName = selectedAttr;
  
      // Call updateVisualizations with the current scatterplot instance
      updateVisualizations(scatterplot);
  };
  
  attributeSelect1.onchange = (event) => {
      handleAttributeSelectChange(event, 1);
  };
  
  attributeSelect2.onchange = (event) => {
      handleAttributeSelectChange(event, 2);
  };
     
      

}
).catch((error) => {
    console.error("Error", error);
  });