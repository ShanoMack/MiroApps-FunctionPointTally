import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '../src/assets/style.css';

//==========================================================================
//The functions
async function tallyFunctionPoints() 
{
  // Get an array with the selected item(s) and their properties
  const selection = await miro.board.getSelection();
  console.log("Selection:", selection);

  if (!selection.length) 
  {
    const message = "Please make a selection first.";
    //alert(message);
    displayMessage("error", message);
    return;
  }

  //Get the position of the first selected item
  const selectedItem = selection[0]; // Assuming the first selected item    
  const position = 
  {
    x: selectedItem.x,
    y: selectedItem.y,
  }; // Get the position of the selected element

  const counts = 
  {
    inputs: { simple: 0, average: 0, complex: 0, undefinedComplexity: 0 },
    inquiries: { simple: 0, average: 0, complex: 0, undefinedComplexity: 0 },
    outputs: { simple: 0, average: 0, complex: 0, undefinedComplexity: 0 },
    internal: { simple: 0, average: 0, complex: 0, undefinedComplexity: 0 },
    external: { simple: 0, average: 0, complex: 0, undefinedComplexity: 0 }
  };
  let functionPointTally = 0;

  // Loop through each selected widget
  for (const widget of selection) 
  {
    if (widget.type === 'card' && widget.tagIds) 
    { 
      // Only process cards with tags
      const tags = await Promise.all(widget.tagIds.map(id => miro.board.getById(id)));

      // Helper function to check for tags and increment score
      const checkAndTally = (typeTag, complexityTag, type, complexity, points) => {
        const hasTypeTag = tags.some(tag => tag.title.includes(typeTag));
        const hasComplexityTag = tags.some(tag => tag.title.includes(complexityTag));

        if (hasTypeTag && hasComplexityTag) {
          counts[type][complexity]++;
          functionPointTally += points;
          return true; // Indicate that a specific complexity was found
        }
        return false; // No complexity found
      };

      // Apply tally rules based on tags present
      let complexityFound = false;
      complexityFound = complexityFound || checkAndTally("T: Input", "C: Simple", "inputs", "simple", 3);
      complexityFound = complexityFound || checkAndTally("T: Input", "C: Average", "inputs", "average", 4);
      complexityFound = complexityFound || checkAndTally("T: Input", "C: Complex", "inputs", "complex", 6);

      if (!complexityFound && tags.some(tag => tag.title.includes("T: Input"))) {
        counts.inputs.undefinedComplexity++;
        functionPointTally += 4; // Default average score for missing complexity
      }

      complexityFound = false;
      complexityFound = complexityFound || checkAndTally("T: Inquiry", "C: Simple", "inquiries", "simple", 3);
      complexityFound = complexityFound || checkAndTally("T: Inquiry", "C: Average", "inquiries", "average", 4);
      complexityFound = complexityFound || checkAndTally("T: Inquiry", "C: Complex", "inquiries", "complex", 6);

      if (!complexityFound && tags.some(tag => tag.title.includes("T: Inquiry"))) {
        counts.inquiries.undefinedComplexity++;
        functionPointTally += 4;
      }

      complexityFound = false;
      complexityFound = complexityFound || checkAndTally("T: Output", "C: Simple", "outputs", "simple", 4);
      complexityFound = complexityFound || checkAndTally("T: Output", "C: Average", "outputs", "average", 5);
      complexityFound = complexityFound || checkAndTally("T: Output", "C: Complex", "outputs", "complex", 7);

      if (!complexityFound && tags.some(tag => tag.title.includes("T: Output"))) {
        counts.outputs.undefinedComplexity++;
        functionPointTally += 5;
      }

      complexityFound = false;
      complexityFound = complexityFound || checkAndTally("T: Internal", "C: Simple", "internal", "simple", 7);
      complexityFound = complexityFound || checkAndTally("T: Internal", "C: Average", "internal", "average", 10);
      complexityFound = complexityFound || checkAndTally("T: Internal", "C: Complex", "internal", "complex", 15);

      if (!complexityFound && tags.some(tag => tag.title.includes("T: Internal"))) {
        counts.internal.undefinedComplexity++;
        functionPointTally += 10;
      }

      complexityFound = false;
      complexityFound = complexityFound || checkAndTally("T: External", "C: Simple", "external", "simple", 5);
      complexityFound = complexityFound || checkAndTally("T: External", "C: Average", "external", "average", 7);
      complexityFound = complexityFound || checkAndTally("T: External", "C: Complex", "external", "complex", 10);

      if (!complexityFound && tags.some(tag => tag.title.includes("T: External"))) {
        counts.external.undefinedComplexity++;
        functionPointTally += 7;
      }
    }
  }

  // Check if any tags were tallied
  if (functionPointTally === 0) 
  {
      const message = "No cards with the appropriate tags were included in the selection.";
      //alert(message);
      displayMessage("error", message);
      return;
  }

  // Output the results
  //console.log("Counts:", counts);

  const message = "Function point tally: " + functionPointTally;
  //alert(message);
  displayMessage("info", message);

  outputFunctionPointTable(counts, functionPointTally, position);
}

async function outputFunctionPointTable(counts, functionPointTally, selectionPosition) 
{  
  const posOffsetX = 0; // You can adjust this to set how far the text element is from the selection
  const posOffsetY = -300; // Adjust the Y-offset as well
  console.log("Making a table at X: " + (selectionPosition.x + posOffsetX) + "; Y: " + (selectionPosition.y + posOffsetY));

  // Calculate totals for each complexity across all types
  const totalSimple = counts.inputs.simple + counts.inquiries.simple + counts.outputs.simple + counts.internal.simple + counts.external.simple;
  const totalAverage = counts.inputs.average + counts.inquiries.average + counts.outputs.average + counts.internal.average + counts.external.average;
  const totalComplex = counts.inputs.complex + counts.inquiries.complex + counts.outputs.complex + counts.internal.complex + counts.external.complex;
  const totalUndefined = counts.inputs.undefinedComplexity + counts.inquiries.undefinedComplexity + counts.outputs.undefinedComplexity + counts.internal.undefinedComplexity + counts.external.undefinedComplexity;
  const totalAll = totalSimple + totalAverage + totalComplex + totalUndefined;

  // Define rows for the table in Markdown format
  const tableRows = [    
      "### Function Point Tally",
      "| Type | Simple | Average | Complex | Undefined | Total | Point tally |",
      "| ---- | ---- | ---- | ---- | ---- | ---- | ---- |",
      `| Inputs | ${counts.inputs.simple} | ${counts.inputs.average} | ${counts.inputs.complex} | ${counts.inputs.undefinedComplexity} | ${counts.inputs.simple + counts.inputs.average + counts.inputs.complex + counts.inputs.undefinedComplexity} | ${counts.inputs.simple * 3 + counts.inputs.average * 4 + counts.inputs.complex * 6 + counts.inputs.undefinedComplexity * 4} |`,
      `| Inquiries | ${counts.inquiries.simple} | ${counts.inquiries.average} | ${counts.inquiries.complex} | ${counts.inquiries.undefinedComplexity} | ${counts.inquiries.simple + counts.inquiries.average + counts.inquiries.complex + counts.inquiries.undefinedComplexity} | ${counts.inquiries.simple * 3 + counts.inquiries.average * 4 + counts.inquiries.complex * 6 + counts.inquiries.undefinedComplexity * 4} |`,
      `| Outputs | ${counts.outputs.simple} | ${counts.outputs.average} | ${counts.outputs.complex} | ${counts.outputs.undefinedComplexity} | ${counts.outputs.simple + counts.outputs.average + counts.outputs.complex + counts.outputs.undefinedComplexity} | ${counts.outputs.simple * 4 + counts.outputs.average * 5 + counts.outputs.complex * 7 + counts.outputs.undefinedComplexity * 5} |`,
      `| Internal logical files | ${counts.internal.simple} | ${counts.internal.average} | ${counts.internal.complex} | ${counts.internal.undefinedComplexity} | ${counts.internal.simple + counts.internal.average + counts.internal.complex + counts.internal.undefinedComplexity} | ${counts.internal.simple * 7 + counts.internal.average * 10 + counts.internal.complex * 15 + counts.internal.undefinedComplexity * 10} |`,
      `| External interface files | ${counts.external.simple} | ${counts.external.average} | ${counts.external.complex} | ${counts.external.undefinedComplexity} | ${counts.external.simple + counts.external.average + counts.external.complex + counts.external.undefinedComplexity}  | ${counts.external.simple * 5 + counts.external.average * 7 + counts.external.complex * 10 + counts.external.undefinedComplexity * 7} |`,
      `| **Totals** | **${totalSimple}** | **${totalAverage}** | **${totalComplex}** | **${totalUndefined}** | **${totalAll}** | **${functionPointTally}** |`
  ];

  // Join table rows with newline characters for markdown format
  const tableContent = tableRows.join("<br>");

  // Create a new text widget to display the table on the Miro board in Markdown
  const outputTable = await miro.board.createText({
      content: tableContent,
      x: 0, //selectionPosition.x + posOffsetX, // Adjust x-position as needed
      y: 0, //selectionPosition.y + posOffsetY, // Adjust y-position as needed
      width: 600 // Adjust width as needed
  });
  await miro.board.viewport.zoomTo(outputTable); 

  //const message = "Function Point Table added to the Miro board in Markdown format.";
  //alert(message);
}

async function displayMessage(type, message)
{
  switch (type)
  {
    case "error":       
      await miro.board.notifications.showError(message);
      break;
    case "info":      
      await miro.board.notifications.showInfo(message);
      break;
  }
}

async function setupBoardTags() 
{
  const desiredTags = [
    { title: "C: Simple", color: "dark_green" }, //sea green
    { title: "C: Average", color: "yellow" }, //yellow
    { title: "C: Complex", color: "red" }, //orange
    { title: "T: Input", color: "light_green" }, //lime
    { title: "T: Inquiry", color: "blue" }, //blue
    { title: "T: Output", color: "magenta" }, //pink
    { title: "T: Internal", color: "dark_blue" }, //navy
    { title: "T: External", color: "gray" } //grey
  ];

  const tagsToAdd = [];

  for (let tag of desiredTags) 
  {
    const newTag = miro.board.createTag({
      title: tag.title,
      color: tag.color,
    });
    tagsToAdd.push(newTag);
  }

  console.log(tagsToAdd);
  displayMessage("info", "Board is set up with the required tags.");
}

//==========================================================================
//The app interface within Miro
const App = () => 
  {    
    const [tagTally, setTagTally] = React.useState(null);

    const handleTallyTags = async () => {
        console.log("Tally Tags button clicked"); // Debug log
        const tally = await tallyTags();
        setTagTally(tally);
    };

    return (
        <div className="grid wrapper">

          <div className="cs1 ce12">
            <h1>Function point tally</h1>
            <p>Select all the items in your scope diagram and press the button below to tally it up.</p>
            <button className="button button-primary" onClick={tallyFunctionPoints}>Calculate Function Points</button>
            <p>The output will be in markdown format as Miro does not support dynamic table creation for now.</p>
            <p>You can take the output and paste it here: https://markdownlivepreview.com/</p>
          </div>

          <div className="cs1 ce12">
            <h3 class="h3">Set up board</h3>
            <p>Need to import the tags for a new board? Press the button below.</p>
            <button className="button" onClick={setupBoardTags}>Import tags</button>
          </div>

          <div className="cs1 ce12">
            <p class="p-small">
              Last update 2024-11-12 @ 15:50pm<br/>
              Created by Shane Turner © 2024
            </p>
            <p></p>
          </div>
        </div>
    );
};
//==========================================================================
//Add in drag and drop functionality

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
