require('dotenv').config()
const mongoose = require('mongoose')
const { EventHubProducerClient } = require("@azure/event-hubs");
const connectionString = process.env.FABRIC_CONNECTION_STRING

async function publishEvents() {
  const producer = new EventHubProducerClient(connectionString);
 
  const allEvents = [
    { body: { test: "namdz" } },
    { body: { test: "khaixauzai" } }
  ];
 
  // Create a batch
  let batch = await producer.createBatch();
 
  for (const eventData of allEvents) {
    console.log("Sending Event:", eventData.body);
 
    // Try add event
    if (!batch.tryAdd(eventData)) {
      console.log("Batch full, sending batch...");
 
      await producer.sendBatch(batch);
      batch = await producer.createBatch();
 
      // Retry adding event
      if (!batch.tryAdd(eventData)) {
        throw new Error(
          `Event too large for empty batch. Max size: ${batch.maxSizeInBytes}`
        );
      }
    }
  }
 
  // Send remaining batch
  if (batch.count > 0) {
    console.log("Sending final batch...");
    await producer.sendBatch(batch);
  }
 
  await producer.close();
  console.log("Done.");
}
 
// Run
// publishEvents().catch((err) => {
//   console.error("Error sending events:", err);
// });

const connect = async () => {
  try {
    const mongodb = process.env.MONGO_DB
    await mongoose.connect(mongodb, {dbName: 'bunnyStore_database'});
    console.log('Connect successfully')
  } catch (error) {
    console.log('connect failed')
  }
}
module.exports = { connect }