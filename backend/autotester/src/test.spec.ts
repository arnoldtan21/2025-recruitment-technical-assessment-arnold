const request = require("supertest");

describe("Task 1", () => {
  describe("POST /parse", () => {
    const getTask1 = async (inputStr) => {
      return await request("http://localhost:8080")
        .post("/parse")
        .send({ input: inputStr });
    };

    it("example1", async () => {
      const response = await getTask1("Riz@z RISO00tto!");
      expect(response.body).toStrictEqual({ msg: "Rizz Risotto" });
    });

    it("example2", async () => {
      const response = await getTask1("alpHa-alFRedo");
      expect(response.body).toStrictEqual({ msg: "Alpha Alfredo" });
    });

    it("error case", async () => {
      const response = await getTask1("");
      expect(response.status).toBe(400);
    });

    it("should handle multiple hyphens and underscores", async () => {
      const response = await getTask1("spaghetti__--carbonara");
      expect(response.body).toStrictEqual({ msg: "Spaghetti Carbonara" });
    });

    it("should handle trailing and leading spaces", async () => {
      const response = await getTask1("   garlic bread   ");
      expect(response.body).toStrictEqual({ msg: "Garlic Bread" });
    });

    it("should remove special characters", async () => {
      const response = await getTask1("chi!cken  tikka** mas@ala");
      expect(response.body).toStrictEqual({ msg: "Chicken Tikka Masala" });
    });

    it("should handle numbers in input", async () => {
      const response = await getTask1("1234Pasta5");
      expect(response.body).toStrictEqual({ msg: "Pasta" });
    });

    it("should return 400 for empty or invalid input", async () => {
      const response = await getTask1("@#$%^&");
      expect(response.status).toBe(400);
    });
  });
});

describe("Task 2", () => {
  describe("POST /entry", () => {
    const putTask2 = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    it("Add Ingredients", async () => {
      const entries = [
        { type: "ingredient", name: "Egg", cookTime: 6 },
        { type: "ingredient", name: "Lettuce", cookTime: 1 },
      ];
      for (const entry of entries) {
        const resp = await putTask2(entry);
        expect(resp.status).toBe(200);
        expect(resp.body).toStrictEqual({});
      }
    });

    it("Add Recipe", async () => {
      const meatball = {
        type: "recipe",
        name: "Meatball",
        requiredItems: [{ name: "Beef", quantity: 1 }],
      };
      const resp1 = await putTask2(meatball);
      expect(resp1.status).toBe(200);
    });

    it("Congratulations u burnt the pan pt2", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "beef",
        cookTime: -1,
      });
      expect(resp.status).toBe(400);
    });

    it("Congratulations u burnt the pan pt3", async () => {
      const resp = await putTask2({
        type: "pan",
        name: "pan",
        cookTime: 20,
      });
      expect(resp.status).toBe(400);
    });

    it("Unique names", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 10,
      });
      expect(resp.status).toBe(200);

      const resp2 = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp2.status).toBe(400);

      const resp3 = await putTask2({
        type: "recipe",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp3.status).toBe(400);
    });

    it("should reject an ingredient with negative cook time", async () => {
      const response = await putTask2({ type: "ingredient", name: "Tomato", cookTime: -5 });
      expect(response.status).toBe(400);
    });

    it("should reject duplicate ingredient names", async () => {
      await putTask2({ type: "ingredient", name: "Onion", cookTime: 4 });
      const response = await putTask2({ type: "ingredient", name: "Onion", cookTime: 3 });
      expect(response.status).toBe(400);
    });

    it("should reject a recipe with duplicate required item names", async () => {
      const response = await putTask2({
        type: "recipe",
        name: "Sandwich",
        requiredItems: [
          { name: "Bread", quantity: 2 },
          { name: "Bread", quantity: 1 }
        ],
      });
      expect(response.status).toBe(400);
    });

    it("should reject a recipe with an empty requiredItems list", async () => {
      const response = await putTask2({
        type: "recipe",
        name: "Air Soup",
        requiredItems: []
      });
      expect(response.status).toBe(400);
    });

    it("should add a valid ingredient", async () => {
      const response = await putTask2({ type: "ingredient", name: "Cheese", cookTime: 5 });
      expect(response.status).toBe(200);
    });

    it("should add a valid recipe", async () => {
      const response = await putTask2({
        type: "recipe",
        name: "Grilled Cheese",
        requiredItems: [
          { name: "Bread", quantity: 2 },
          { name: "Cheese", quantity: 1 }
        ],
      });
      expect(response.status).toBe(200);
    });
  });
});

describe("Task 3", () => {
  describe("GET /summary", () => {
    const postEntry = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    const getTask3 = async (name) => {
      return await request("http://localhost:8080").get(
        `/summary?name=${name}`
      );
    };

    it("What is bro doing - Get empty cookbook", async () => {
      const resp = await getTask3("nothing");
      expect(resp.status).toBe(400);
    });

    it("What is bro doing - Get ingredient", async () => {
      const resp = await postEntry({
        type: "ingredient",
        name: "beef",
        cookTime: 2,
      });
      expect(resp.status).toBe(200);

      const resp2 = await getTask3("beef");
      expect(resp2.status).toBe(400);
    });

    it("Unknown missing item", async () => {
      const cheese = {
        type: "recipe",
        name: "Baked",
        requiredItems: [{ name: "Not Real", quantity: 1 }],
      };
      const resp1 = await postEntry(cheese);
      expect(resp1.status).toBe(200);

      const resp2 = await getTask3("Baked");
      expect(resp2.status).toBe(400);
    });

    it("Bro cooked", async () => {
      const meatball = {
        type: "recipe",
        name: "Skibidi",
        requiredItems: [{ name: "Bruh", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Bruh",
        cookTime: 2,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Skibidi");
      expect(resp3.status).toBe(200);
    });

    it("Should return 400 for a missing recipe (no corresponding name", async () => {
      const resp = await getTask3("nothing");
      expect(resp.status).toBe(400);
    });

    it("Should return 400 when querying an ingredient instead of a recipe", async () => {
      const resp = await postEntry({
        type: "ingredient",
        name: "mango",
        cookTime: 2,
      });
      expect(resp.status).toBe(200);

      const resp2 = await getTask3("mango");
      expect(resp2.status).toBe(400);
    });

    // Recipe with missing required items should return 400
    it("Should return 400 when a recipe contains a missing required item", async () => {
      const cheese = {
        type: "recipe",
        name: "Smoothie",
        requiredItems: [{ name: "Not Real", quantity: 1 }],
      };
      const resp1 = await postEntry(cheese);
      expect(resp1.status).toBe(200);

      const resp2 = await getTask3("Smoothie");
      expect(resp2.status).toBe(400);
    });

    it("Should return correct cookTime and ingredients for nested recipes", async () => {
      // Step 1: Add base ingredients
      await postEntry({ type: "ingredient", name: "Flour", cookTime: 5 });
      await postEntry({ type: "ingredient", name: "shell", cookTime: 3 });
    
      // Step 2: Add a recipe that uses these ingredients
      const pancakeBatter = {
        type: "recipe",
        name: "Pancakesss",
        requiredItems: [
          { name: "Flour", quantity: 1 },
          { name: "shell", quantity: 1 },
        ],
      };
      await postEntry(pancakeBatter);
    
      // Step 3: Add a recipe that depends on Pancakesss (nested recipe)
      const pancakes = {
        type: "recipe",
        name: "Pancakes",
        requiredItems: [{ name: "Pancakesss", quantity: 2 }],
      };
      await postEntry(pancakes);
    
      // Step 4: Fetch summary for "Pancakes"
      const resp = await getTask3("Pancakes");
      expect(resp.status).toBe(200); // ✅ Expect success
    
      // Step 5: Verify response data
      expect(resp.body).toStrictEqual({
        name: "Pancakes",
        cookTime: 16, // (Flour: 5 * 2) + (shell: 3 * 2) = 10 + 6 = 16
        ingredients: [
          { name: "Flour", quantity: 2 },
          { name: "shell", quantity: 2 },
        ],
      });
    });

    // ✅ CookTime should be summed up correctly for multiple ingredients
    it("Should correctly sum up cookTime when multiple ingredients are used", async () => {
      await postEntry({ type: "ingredient", name: "Beef", cookTime: 5 });
      await postEntry({ type: "ingredient", name: "Egg", cookTime: 3 });

      const omelet = {
        type: "recipe",
        name: "Omelet",
        requiredItems: [{ name: "Egg", quantity: 2 }],
      };

      await postEntry(omelet);
      const resp = await getTask3("Omelet");
      expect(resp.status).toBe(200);
    });

    // Should handle duplicate ingredients appearing in different recipes
    it("Should handle duplicate ingredients appearing in different recipes", async () => {
      await postEntry({ type: "ingredient", name: "protein", cookTime: 5 });
      await postEntry({ type: "ingredient", name: "pepper", cookTime: 3 });

      const dough = {
        type: "recipe",
        name: "Dough",
        requiredItems: [
          { name: "protein", quantity: 1 },
          { name: "pepper", quantity: 1 },
        ],
      };

      const pasta = {
        type: "recipe",
        name: "Pasta",
        requiredItems: [
          { name: "Dough", quantity: 2 },
          { name: "pepper", quantity: 1 },
        ],
      };

      await postEntry(dough);
      await postEntry(pasta);

      const resp = await getTask3("Pasta");
      expect(resp.status).toBe(200);
    });
  });
});
