let express = require("express");
let { sequelize } = require("./lib/index");
let { ticket } = require("./models/ticket.model");
let { agent } = require("./models/agent.model");
let { customer } = require("./models/customer.model");
let { ticketAgent } = require("./models/ticketAgent.model");
let { ticketCustomer } = require("./models/ticketCustomer.model");
let { Op } = require("@sequelize/core");
let app = express();
let port = 3000;
app.use(express.json());

//------------------------------------------------------------------------------------------------------------------------------------//

// Helper function to get ticket's associated customers
async function getTicketCustomers(ticketId) {
  const ticketCustomers = await ticketCustomer.findAll({
    where: { ticketId },
  });

  let customerData;
  for (let cus of ticketCustomers) {
    customerData = await customer.findOne({
      where: { customerId: cus.customerId },
    });
  }

  return customerData;
}

// Helper function to get ticket's associated agents
async function getTicketAgents(ticketId) {
  const ticketAgents = await ticketAgent.findAll({
    where: { ticketId },
  });

  let agentData;
  for (let ag of ticketAgents) {
    agentData = await agent.findOne({ where: { agentId: ag.agentId } });
  }

  return agentData;
}

// Helper function to get ticket details with associated customers and agents
async function getTicketDetails(ticketData) {
  const customers = await getTicketCustomers(ticketData.id); // Get all customers
  const agents = await getTicketAgents(ticketData.id); // Get all agents

  return {
    ...ticketData.dataValues,
    customer: customers, // Return all customers
    agent: agents, // Return all agents
  };
}

//function to sort tickets by priority//
async function sortTickets() {
  let tickets = await ticket.findAll();
  let sortedTickets = tickets.sort(
    (ticket1, ticket2) => ticket1.priority - ticket2.priority,
  );
  return sortedTickets;
}

//function to add a new ticket//
async function addNewTicket(data) {
  let newTickets = await ticket.create(data);
  return newTickets;
}

//function to update a ticket//
async function updateTicket(ticketId, ticketDetails) {
  const ticketData = await ticket.findOne({ where: { id: ticketId } });
  if (!ticketData) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  for (let prop in ticketDetails) {   //prop is key of the object//
    if (prop in ticketData) {
      ticketData[prop] = ticketDetails[prop];
    }
  }

  await ticketData.save();

  if (ticketDetails.customerId) {
    await ticketCustomer.destroy({ where: { ticketId: ticketData.id } });
    await ticketCustomer.create({
      ticketId: ticketData.id,
      customerId: ticketDetails.customerId,
    });
  }

  if (ticketDetails.agentId) {
    await ticketAgent.destroy({ where: { ticketId: ticketData.id } });
    await ticketAgent.create({
      ticketId: ticketData.id,
      agentId: ticketDetails.agentId,
    });
  }
  return ticketData;
}

//------------------------------------------------------------------------------------------------------------------------------------//
//seed data//

app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });

  let tickets = await ticket.bulkCreate([
    {
      ticketId: 1,
      title: "Login Issue",
      description: "Cannot login to account",
      status: "open",
      priority: 1,
      customerId: 1,
      agentId: 1,
    },
    {
      ticketId: 2,
      title: "Payment Failure",
      description: "Payment not processed",
      status: "closed",
      priority: 2,
      customerId: 2,
      agentId: 2,
    },
    {
      ticketId: 3,
      title: "Bug Report",
      description: "Found a bug in the system",
      status: "open",
      priority: 3,
      customerId: 1,
      agentId: 1,
    },
  ]);

  let customers = await customer.bulkCreate([
    { customerId: 1, name: "Alice", email: "alice@example.com" },
    { customerId: 2, name: "Bob", email: "bob@example.com" },
  ]);

  let agents = await agent.bulkCreate([
    { agentId: 1, name: "Charlie", email: "charlie@example.com" },
    { agentId: 2, name: "Dave", email: "dave@example.com" },
  ]);

  await ticketCustomer.bulkCreate([
    { ticketId: tickets[0].id, customerId: customers[0].id },
    { ticketId: tickets[2].id, customerId: customers[0].id },
    { ticketId: tickets[1].id, customerId: customers[1].id },
  ]);

  await ticketAgent.bulkCreate([
    { ticketId: tickets[0].id, agentId: agents[0].id },
    { ticketId: tickets[2].id, agentId: agents[0].id },
    { ticketId: tickets[1].id, agentId: agents[1].id },
  ]);

  return res.json({ message: "Database seeded successfully" });
});

//api to get all tickets//
app.get("/tickets", async (req, res) => {
  try {
    const tickets = await ticket.findAll();
    const detailedTickets = [];

    if (tickets.length === 0) {
      return res.status(404).json({ message: "No tickets found." });
    }

    for (let ticket of tickets) {
      const details = await getTicketDetails(ticket);
      detailedTickets.push(details);
    }

    return res.status(200).json({ tickets: detailedTickets });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching tickets." });
  }
});

//api to get ticket by id//
app.get("/tickets/details/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const tickets = await ticket.findOne({ where: { id: ticketId } });

    if (!tickets) {
      return res.status(404).json({ message: "Ticket not found." });
    }
    const details = await getTicketDetails(tickets);
    return res.status(200).json({ ticket: details });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching the ticket.",
      error: error.message,
    });
  }
});

//api to get ticket by Status//
app.get("/tickets/status/:status", async (req, res) => {
  let status = req.params.status;
  try {
    let tickets = await ticket.findAll({ where: { status: status } });
    if (tickets.length === 0) {
      res.status(400).json({ message: "No tickets found with this status" });
    }

    let detailedTickets = [];
    for (let ticket of tickets) {
      const details = await getTicketDetails(ticket);
      detailedTickets.push(details);
    }
    res.status(200).json({ ticket: detailedTickets });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching the ticket.",
      error: error.message,
    });
  }
});

//api to get tickets by priority//
app.get("/tickets/sort-by-priority", async (req, res) => {
  try {
    let tickets = await sortTickets();

    //to check if the tickets are sorted and returned //
    if (tickets.length === 0) {
      res.status(404).json({ message: "No Tickets found" });
    }

    let ticketDetails = [];
    for (let i = 0; i < tickets.length; i++) {
      let details = await getTicketDetails(tickets[i]);
      ticketDetails.push(details);
    }
    res.status(200).json(ticketDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//api to add a new ticket//
app.post("/tickets/new", async (req, res) => {
  try {
    // Create a new ticket in the database
    let tickets = req.body;
    let newTicket = await addNewTicket(tickets);

    // Create associations in the junction tables
    await ticketCustomer.create({
      ticketId: newTicket.id,
      customerId: tickets.customerId,
    });
    await ticketAgent.create({
      ticketId: newTicket.id,
      agentId: tickets.agentId,
    });

    // Get the full details of the new ticket, including customer and agent info
    const detailedTicket = await getTicketDetails(newTicket);

    // Send the response
    res.status(201).json({ ticket: detailedTicket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//api to update a ticket//
app.post("/tickets/update/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticketDetails = req.body;
    const ticketData = await updateTicket(ticketId, ticketDetails);
    if (!ticketData) {
      res.status(404).json({ message: "Ticket not found" });
    }
    const updatedTicket = await getTicketDetails(ticketData);
    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//api to delete a tickets//
app.post("/tickets/delete", async (req, res) => {
  try {
    const { id } = req.body;
    await ticket.destroy({ where: { id } });
    await ticketCustomer.destroy({ where: { ticketId: id } });
    await ticketAgent.destroy({ where: { ticketId: id } });
    res.json({ message: `Ticket with ID ${id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//---------------------------------------------------------------------------------------------------------------------------------//

//server establish//
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
