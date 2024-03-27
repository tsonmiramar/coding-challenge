"use strict";

const { MinPriorityQueue } = require('@datastructures-js/priority-queue');
// Print all entries, across all of the sources, in chronological order.

const minHeap = new MinPriorityQueue((logEntry) => logEntry.date.getTime());

const enqueueEntry = (buffer, entry, logSources, sourceIndex) => {
  if (!!entry) {
    minHeap.enqueue({...entry, sourceIndex});
    // Here we start a new popAsync() process right after the re-heapping of the previous entry 
    buffer[sourceIndex] = logSources[sourceIndex].popAsync();
  }
}

// Print all entries, across all of the *async* sources, in chronological order.
module.exports = async (logSources, printer) => {
  /**
   * Since there is a delay in retrieving the entry,
   * we can simultaneously perform multiple popAsync() and maintain
   * each process in a buffer
   * 
   * The minHeap can carry on its operation, but will do the following:
   *    - Wait until a new entry is available from the buffer
   *    - After re-heapping the entry, start a new popAsync() process for the same logSource
   * 
   * With this approach, we can speed up the entry retrieval time using asynchronous process so that
   * each new entry fetching does not have to depend on the previous entry to be re-heapped sequentially.
   */
  const buffer = logSources.map((logSource) => logSource.popAsync());

  // Asynchronously enqueue the all earliest log entry across all logSources
  const entries = await Promise.all(buffer);
  entries.forEach((entry, sourceIndex) => enqueueEntry(buffer, entry, logSources, sourceIndex));
  
  while (!minHeap.isEmpty()) {
    const element = minHeap.dequeue();
    printer.print(element);

    const { sourceIndex } = element;
    if (logSources[sourceIndex].drained) {
      continue;
    }

    const entry = await buffer[sourceIndex];
    enqueueEntry(buffer, entry, logSources, sourceIndex);
  }

  printer.done();
};
