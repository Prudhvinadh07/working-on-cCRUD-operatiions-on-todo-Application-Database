const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const todoItem = request.body;
  const { id, todo, priority, status } = todoItem;
  const insertTodoQuery = `
    INSERT INTO todo(id, todo, priority, status)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );
    `;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let replaceTodo = "";
  const todoDetails = request.body;
  switch (true) {
    case todoDetails.status !== undefined:
      replaceTodo = "Status";
      break;
    case todoDetails.priority !== undefined:
      replaceTodo = "Priority";
      break;
    case todoDetails.todo !== undefined:
      replaceTodo = "Todo";
      break;
  }
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
    `;
  const recentTodo = await db.get(getTodoQuery);

  const {
    todo = recentTodo.todo,
    priority = recentTodo.priority,
    status = recentTodo.status,
  } = request.body;
  const updateTodoQuery = `
    UPDATE todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE id = ${todoId};
    `;
  await db.run(updateTodoQuery);
  response.send(`${replaceTodo} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
