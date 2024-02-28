const attr = {
    poverty_perc: {
        label: "Poverty %",
        color: "#FFDAB9", // light orange
      },
      median_household_income: {
        label: "Median Household Income %",
        color: "#90EE90", // light green
      },
      education_less_than_high_school_percent: {
        label: "Education Less Than High School",
        color: "#D8BFD8", // light purple
      },
      air_quality: {
        label: "Air Quality",
        color: "#ADD8E6", // light blue
      },
      park_access: {
        label: "Park Access",
        color: "#367d3e", // dark green
      },
      percent_inactive: {
        label: "Inactive %",
        color: "#FFC0CB", // light pink
      },
      percent_smoking: {
        label: "Smoking %",
        color: "#D3D3D3", // light grey
      },
      urban_rural_status: {
        label: "Urban/Rural Status",
        color: "#FFFFE0", // light yellow
      },
      elderly_percentage: {
        label: "Elderly %",
        color: "#E6E6FA", // light lavender
      },
      number_of_hospitals: {
        label: "Number of Hospitals",
        color: "#E0FFFF", // light cyan
      },
      number_of_primary_care_physicians: {
        label: "Number of Primary Care Physicians",
        color: "#7FFFD4", // light awua
      },
      percent_no_heath_insurance: {
        label: "No Health Insurance",
        color: "#FFA07A", // light red
      },
      percent_high_blood_pressure: {
        label: "High Blood Pressure",
        color: "#F08080", // light coral
      },
      percent_coronary_heart_disease: {
        label: "Coronary Heart Disease",
        color: "#FFA07A", // light salmon
      },
      percent_stroke: {
        label: "Stroke %",
        color: "#FF7377" // light red
      },
      percent_high_cholesterol: {
        label: "High Cholesterol %",
        color: "#87CEFA", // light sky blue
      },

};

let filteredCounties, geoData, countiesData;
let scatterplot, chloropleth1, chloropleth2
let hist1, hist2, bar1, bar2


Promise.all([
    d3.csv("./data/national_health_data.csv"),
    d3.json("./data/counties-10m.json"),
]).then((data) => {
    countiesData = data[0];
    geoData = data[1];

    const attrAvailable = Object.keys(countiesData[0]);


    // cleaning the data unless the attr is urban_rural_status
    countiesData.forEach((d) => {
        attrAvailable.forEach((attribute) => {
          if (attribute === "display_name")
            newVal = d[attribute]
              .replaceAll('"', "")
              .replaceAll("(", "")
              .replaceAll(")", "");
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

      updateVisualizations = (currentVis) => {
        const selectedAttr1 = attributeSelect1.value;
        const selectedAttr2 = attributeSelect2.value;
  
        if (selectedAttr1 === "urban_rural_status") bar1.updateVis();
        if (selectedAttr2 === "urban_rural_status") bar2.updateVis();
        if (selectedAttr1 !== "urban_rural_status") hist1.updateVis();
        if (selectedAttr2 !== "urban_rural_status") hist2.updateVis();
        if (
          selectedAttr1 === "urban_rural_status" ||
          selectedAttr2 === "urban_rural_status"
        )
        if (
          selectedAttr1 !== "urban_rural_status" ||
          selectedAttr2 !== "urban_rural_status"
        )
          scatterplot.updateVis();
        choropleth1.updateVis();
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
  

      hist1 = new Combinedchart(
        {
          parentElement: "#hist1",
        },
        attributeSelect1.value,
        1, "histogram"
      );
      hist2 = new Combinedchart(
        {
          parentElement: "#hist2",
        },
        attributeSelect2.value,
        2,  "histogram"
      );
      bar1 = new Combinedchart({ parentElement: "#bar1" },  attributeSelect1.value,
      1, "barchart");
      bar2 = new Combinedchart({ parentElement: "#bar2" }, attributeSelect2.value,
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
        1
      );
      choropleth2 = new chloropeth(
        {
          parentElement: "#choropleth2",
        },
        attributeSelect2.value,
        2
      );


    
      attributeSelect1.onchange = (event) => {
        const selectedAttr = event.target.value;
        const histogram1Element = document.getElementById("hist1");
        const barchart1Element = document.getElementById("bar1");
        const scatterplotElement = document.getElementById("scatterplot");
       
  
        if (selectedAttr === "urban_rural_status") {
          histogram1Element.style.display = "none";
          barchart1Element.style.display = "block";
        } else {
          histogram1Element.style.display = "block";
          barchart1Element.style.display = "none";
        }
  
        if (
          selectedAttr === "urban_rural_status" ||
          attributeSelect2.value === "urban_rural_status"
        ) {
          scatterplotElement.style.display = "none";
        
        } else {
          scatterplotElement.style.display = "block";
        }
  
        hist1.attributeName = selectedAttr;
  
        scatterplot.attribute1Name = selectedAttr;
  
        choropleth1.attributeName = selectedAttr;
  
        updateVisualizations(null);
      };
      attributeSelect2.onchange = (event) => {
        const selectedAttr = event.target.value;
        const histogram2Element = document.getElementById("hist2");
        const barchart2Element = document.getElementById("bar2");
        const scatterplotElement = document.getElementById("scatterplot");

      
        if (selectedAttr === "urban_rural_status") {
          histogram2Element.style.display = "none";
          barchart2Element.style.display = "block";
        } else {
          histogram2Element.style.display = "block";
          barchart2Element.style.display = "none";
        }
  
        if (
          selectedAttr === "urban_rural_status" ||
          attributeSelect1.value === "urban_rural_status"
        ) {
          scatterplotElement.style.display = "none";
       
        } else {
          scatterplotElement.style.display = "block";
        }
  
        hist2.attributeName = selectedAttr;
  
        scatterplot.attribute2Name = selectedAttr;
  
        choropleth2.attributeName = selectedAttr;
  
        updateVisualizations(null);
      };
    
      

}
).catch((error) => {
    console.error("Error", error);
  });