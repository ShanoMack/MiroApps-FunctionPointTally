import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '../src/assets/style.css';

//==========================================================================
//The functions
async function methodToRun() 
{
    // Get an array with the selected item(s) and their properties
    const selection = await miro.board.getSelection();
    console.log("Selection:", selection);

    if (!selection.length) {
        const message = "Please make a selection first.";
        //alert(message);
        displayMessage("error", message);
        return;
    }

    //Get the position of the first selected item
    const selectedItem = selection[0]; // Assuming the first selected item    
    const position = {
      x: selectedItem.x,
      y: selectedItem.y,
    }; // Get the position of the selected element
  
    const counts = 
    {
      inputs: { simple: 0, average: 0, complex: 0 },
      inquiries: { simple: 0, average: 0, complex: 0 },
      outputs: { simple: 0, average: 0, complex: 0 },
      internal: { simple: 0, average: 0, complex: 0 },
      external: { simple: 0, average: 0, complex: 0 }
    };
    let functionPointTally = 0;

    // Loop through each selected widget
    for (const widget of selection) 
    {
      if (widget.type === 'card' && widget.tagIds) { // Only process cards with tags
          const tags = await Promise.all(widget.tagIds.map(id => miro.board.getById(id)));

          // Helper function to check for tags and increment score
          const checkAndTally = (typeTag, complexityTag, type, complexity, points) => {
              if (tags.some(tag => tag.title.includes(typeTag)) && tags.some(tag => tag.title.includes(complexityTag))) {
                  counts[type][complexity]++;
                  functionPointTally += points;
              }
          };

          // Apply tally rules based on tags present
          checkAndTally("T: Input", "C: Simple", "inputs", "simple", 3);
          checkAndTally("T: Input", "C: Average", "inputs", "average", 4);
          checkAndTally("T: Input", "C: Complex", "inputs", "complex", 6);

          checkAndTally("T: Inquiry", "C: Simple", "inquiries", "simple", 3);
          checkAndTally("T: Inquiry", "C: Average", "inquiries", "average", 4);
          checkAndTally("T: Inquiry", "C: Complex", "inquiries", "complex", 6);

          checkAndTally("T: Output", "C: Simple", "outputs", "simple", 4);
          checkAndTally("T: Output", "C: Average", "outputs", "average", 5);
          checkAndTally("T: Output", "C: Complex", "outputs", "complex", 7);

          checkAndTally("T: Internal", "C: Simple", "internal", "simple", 7);
          checkAndTally("T: Internal", "C: Average", "internal", "average", 10);
          checkAndTally("T: Internal", "C: Complex", "internal", "complex", 15);

          checkAndTally("T: External", "C: Simple", "external", "simple", 5);
          checkAndTally("T: External", "C: Average", "external", "average", 7);
          checkAndTally("T: External", "C: Complex", "external", "complex", 10);
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

  // Define rows for the table in Markdown format
  const tableRows = [    
      "### Function Point Tally",
      "| Type | Simple | Average | Complex | Total | Point tally |",
      "| ---- | ---- | ---- | ---- | ---- | ---- |",
      `| Inputs | ${counts.inputs.simple} | ${counts.inputs.average} | ${counts.inputs.complex} | ${counts.inputs.simple + counts.inputs.average + counts.inputs.complex} | ${counts.inputs.simple * 3 + counts.inputs.average * 4 + counts.inputs.complex * 6} |`,
      `| Inquiries | ${counts.inquiries.simple} | ${counts.inquiries.average} | ${counts.inquiries.complex} | ${counts.inquiries.simple + counts.inquiries.average + counts.inquiries.complex} | ${counts.inquiries.simple * 3 + counts.inquiries.average * 4 + counts.inquiries.complex * 6} |`,
      `| Outputs | ${counts.outputs.simple} | ${counts.outputs.average} | ${counts.outputs.complex} | ${counts.outputs.simple + counts.outputs.average + counts.outputs.complex} | ${counts.outputs.simple * 4 + counts.outputs.average * 5 + counts.outputs.complex * 7} |`,
      `| Internal logical files | ${counts.internal.simple} | ${counts.internal.average} | ${counts.internal.complex} | ${counts.internal.simple + counts.internal.average + counts.internal.complex} | ${counts.internal.simple * 7 + counts.internal.average * 10 + counts.internal.complex * 15} |`,
      `| External interface files | ${counts.external.simple} | ${counts.external.average} | ${counts.external.complex} | ${counts.external.simple + counts.external.average + counts.external.complex}  | ${counts.external.simple * 5 + counts.external.average * 7 + counts.external.complex * 10} |`,
      `| **Total function points** | | | | | **${functionPointTally}** |`
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
            <h1 className="cs1 ce12">Function point tally</h1>
            <div className="cs1 ce12">
                <p>Select all the items in your scope diagram and press the button below to tally it up.</p>
            </div>
            {/* New Button to Tally Tags */}
            <div className="cs1 ce12">
              <button className="button button-primary" onClick={methodToRun}>Calculate Function Points</button>
              <p>The output will be in markdown format as Miro does not support dynamic table creation for now.</p>
              <p>You can take the output and paste it here: https://markdownlivepreview.com/</p>
            </div>
        </div>
    );
};
//==========================================================================

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
