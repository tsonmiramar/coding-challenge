"use strict";

const { MinPriorityQueue } = require('@datastructures-js/priority-queue');
// Print all entries, across all of the sources, in chronological order.

const minHeap = new MinPriorityQueue((logEntry) => logEntry.date.getTime());

// helper
const enqueueNextElement = (logSources, i) => {
  if (logSources[i].drained) {
    return;
  }

  const entry = logSources[i].pop();
  if (!!entry) {
    minHeap.enqueue({...entry, sourceIndex: i});
  }
}

module.exports = (logSources, printer) => {
  // Insert the all earliest entry across all logs into the min heap
  for (let i = 0; i < logSources.length; i+=1) {
    enqueueNextElement(logSources, i);
  }

  // The min heap will maintain earliest entry across all logs
  // dequeue an entry from the heap, print it and add another entry from the same source of the dequeued entry
  // The minHeap will maintain at maximum 1 element per source (k total for k sources) (O(k))
  // Sorting time complexity will be O(Nklog(k)) for N entries per source for k sources 
  while (!minHeap.isEmpty()) {
    const element = minHeap.dequeue();
    printer.print(element);

    const { sourceIndex } = element;
    enqueueNextElement(logSources, sourceIndex);
  }
  printer.done();
  return console.log("Sync sort complete.");
};