import * as React from 'react';
import '../src/assets/style.css';
import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/button';
import { Card, CardContent, CardFooter } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { X } from 'lucide-react';

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

  openWebpageWithResults(counts, functionPointTally);
}

async function openWebpageWithResults(counts, functionPointTally) 
{
  const baseUrl = "https://function-point-tally.vercel.app/";
  
  // Create URL with query parameters
  const params = new URLSearchParams({
    input_simple: counts.inputs.simple,
    input_average: counts.inputs.average,
    input_complex: counts.inputs.complex,
    input_undefined: counts.inputs.undefinedComplexity,
    output_simple: counts.outputs.simple,
    output_average: counts.outputs.average,
    output_complex: counts.outputs.complex,
    output_undefined: counts.outputs.undefinedComplexity,
    inquiry_simple: counts.inquiries.simple,
    inquiry_average: counts.inquiries.average,
    inquiry_complex: counts.inquiries.complex,
    inquiry_undefined: counts.inquiries.undefinedComplexity,
    external_simple: counts.external.simple,
    external_average: counts.external.average,
    external_complex: counts.external.complex,
    external_undefined: counts.external.undefinedComplexity,
    internal_simple: counts.internal.simple,
    internal_average: counts.internal.average,
    internal_complex: counts.internal.complex,
    internal_undefined: counts.internal.undefinedComplexity
  });

  const fullUrl = baseUrl + "?" + params.toString();
  
  // Open the webpage with the results
  window.open(fullUrl, '_blank');
  
  console.log("Opening webpage with results: " + fullUrl);
  displayMessage("info", "Results page opened in new tab");
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
    { title: "T: External", color: "slate" } //grey
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
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col gap-6">
        {/* Compact Header */}
        <header className="w-full flex items-center justify-between border-b bg-white pl-4 pr-2 py-2 shadow-sm">
          <div className="text-lg font-medium text-slate-600">Function Point Tally</div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => miro.board.ui.closePanel && miro.board.ui.closePanel()}
            className="h-8 w-8 p-0"
            aria-label="Close"
          >
            <X className='w-5 h-5 text-slate-600'/>
          </Button>
        </header>

        <div className='px-6 w-full'>
          {/* Main Content */}
          <Card className="w-full">
            <CardContent>
              <div className="flex flex-col items-start gap-4">
                <div className='flex flex-col items-start gap-2'>
                  <div className='text-xs font-semibold tracking-wider uppercase text-slate-500'>Step 1</div>
                  <p className="text-base text-slate-800">
                    Ensure you have the correct tags set up on your board. You only need to do this once per board.
                  </p>
                  <Button 
                    onClick={setupBoardTags}
                    variant="secondary"
                  >
                    Import tags
                  </Button>                  
                </div>
                <Separator />
                <div className='flex flex-col items-start gap-2'>
                  <div className='text-xs font-semibold tracking-wider uppercase text-slate-500'>Step 2</div>
                  <p className="text-base text-slate-800">
                    Select the card elements in your scope diagram
                  </p>
                </div>
                <Separator />
                <div className='flex flex-col items-start gap-2'>
                  <div className='text-xs font-semibold tracking-wider uppercase text-slate-500'>Step 3</div>
                  <p className="text-base text-slate-800">
                    Click the button below to tally the function points based on the tags applied to the selected cards.
                  </p>
                  <Button 
                    onClick={tallyFunctionPoints}
                  >
                    Tally function points
                  </Button>
                </div>
                <Separator />
                <p className="text-sm text-slate-600">
                  The results will be displayed in a new webpage with a detailed function point table.<br/>
                  Link to <a href="https://function-point-tally.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Function Point Calculator</a>
                </p>
              </div>
            </CardContent>
          </Card>          
        </div>

        {/* Footer */}
        <footer className="w-full h-full flex flex-col bg-white px-4 py-2 mt-auto text-xs text-slate-500 border-t">
          <span>Created by Shane Turner © 2025</span>
          <span>Last updated 2025-07-08</span>
        </footer>
      </div>
    );
};
//==========================================================================
//Add in drag and drop functionality

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
