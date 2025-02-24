import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!

//map to store cookbook, either receipt or ingredeint entries
const cookbook: Map<string, recipe | ingredient> = new Map();


// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
    // replace hyphens and underscores with spaces, replace non-letter characters, removing leading, trailing whitespace
    recipeName = recipeName.replace(/[-_]/g, ' ').replace(/[^a-zA-Z ]/g, '').trim();
  
    // split the string into a list of words
    let words = recipeName.split(/\s+/);
  
    // capitalize the first letter of each word and return as string
    let formattedName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  
    //if formatted_name is not empty, return it.
    return formattedName.length > 0 ? formattedName : null;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req: Request, res: Response) => {
  // extract data from request body
  const { type, name, requiredItems, cookTime } = req.body;

  //ensure the type is either "recipe" or "ingredient", if not, 400 status code
  if (type !== "recipe" && type !== "ingredient") {
    return res.status(400).send("Invalid entry type");
  }

  // the cookbook must not allow duplicate names, check map for pre-existing name
  if (cookbook.has(name)) {
    return res.status(400).send("Entry name must be unique");
  }

  if (type === "ingredient") {
    // cookTime must be a number and at least 0
    if (cookTime === undefined || typeof cookTime !== "number" || cookTime < 0) {
      return res.status(400).send("Invalid cookTime");
    }
    //add ingredient to cookbook map
    cookbook.set(name, { type, name, cookTime });
  } else if (type === "recipe") {
    //required items must be array and required items must not be empty
    if (!Array.isArray(requiredItems) || requiredItems.length === 0) {
      return res.status(400).send("Invalid requiredItems");
    }

    //validate required items
    const itemMap = new Map<string, number>();

    for (const item of requiredItems) {
      //check for invalid format
      if (!item.name || typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).send("Invalid required item format");
      }
      //check for duplicate required items
      if (itemMap.has(item.name)) {
        return res.status(400).send("Duplicate required item names are not allowed");
      }
      itemMap.set(item.name, item.quantity);
    }
    //add receipe to cookbook 
    cookbook.set(name, { type, name, requiredItems });
  }

  res.status(200).send({});
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req: Request, res: Response) => {
  //retrieve the recipe name from the query parameter
  const recipeName = req.query.name as string;

  // check if the recipe exists, if not 400 bad request
  if (!cookbook.has(recipeName)) {
    return res.status(400).send("Recipe not found");
  }

  //check that it is not an ingredient
  const recipe = cookbook.get(recipeName);
  if (!recipe || recipe.type !== "recipe") {
    return res.status(400).send("Invalid recipe");
  }

  let cookTime = 0; //total cooking time
  //Maps ingredient names to their total quantities.
  let ingredientMap: Map<string, number> = new Map(); 

  //recursive helper function, extracts all base ingredients from a recipe 
  const collectIngredients = (requiredItems: requiredItem[], multiplier: number): boolean => {
    for (const item of requiredItems) {
      //check that items exist in cookbook
      if (!cookbook.has(item.name)) {
        return false; // Return failure instead of sending response directly
      } 
      const entry = cookbook.get(item.name);

      if (entry?.type === "ingredient") {
        //type assertion as ingredient (from ingredient OR receipe)
        const ingredientEntry = entry as ingredient;
        //multiplier used for case of nesting: ie receipe in receipe
        cookTime += ingredientEntry.cookTime * item.quantity * multiplier;
        //updates the total quantity of an ingredient in ingredientMap
        ingredientMap.set(
          item.name,
          (ingredientMap.get(item.name) || 0) + item.quantity * multiplier
        );
      } else if (entry?.type === "recipe") {
        //type assertion as receipe (from ingredient OR receipe)
        const recipeEntry = entry as recipe;
        //recurse into found receipe
        if (!collectIngredients(recipeEntry.requiredItems, item.quantity * multiplier)) {
          return false;
        }
      }
    }
    return true;
  };

  //call function
  if (!collectIngredients((recipe as recipe).requiredItems, 1)) {
    return res.status(400).send("Recipe contains missing ingredients");
  }

  //converts ingredientMap (a Map) into an array of { name, quantity } objects.
  const ingredients: requiredItem[] = Array.from(ingredientMap.entries()).map(
    ([name, quantity]) => ({ name, quantity })
  );

  res.json({ name: recipe.name, cookTime, ingredients });
});
  

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
