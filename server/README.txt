Kafka at 13 GB/s – when the "obvious" solution costs 2,000 CPU cores

A case study by Vladimir Balun about developing a high-load tracing system at Yandex.

When I was leading the development of the tracing system at Yandex, it was handling about 11 gigabytes per second. At some point, we wanted to add reliable span delivery. The most logical solution was to put Kafka in the middle and write through it. Under normal workloads, this seemed simple and straightforward.

But when we calculated the resources for our traffic volume, we found that we needed about 1,000-2,000 CPU cores just for this task, not counting memory and disks. With this requirement, we went back to the hardware store the following year and were faced with a very logical question: was it really worth spending so much resources to increase reliability in the rare case of lost spans?

Kafka would have worked. But its cost proved too high for our workload.

And in large systems, this becomes the key criterion – not "can it be done," but "at what cost."

Workload determines architecture

The second story is related to security. Developers sometimes wrote sensitive data to spans, and the right solution seemed to be to mask everything at the input, running the traffic through regular expressions to search for cards, passwords, and tokens.

But running heavy regular expressions on 11 GB/s of incoming traffic meant wasting a colossal amount of CPU resources.

In the end, we accepted a compromise. From a security perspective, this decision was questionable: the data was stored unmasked for some time. And in an ideal architecture, this is unacceptable.

Why was this acceptable? Because the nature of the workload allowed it.

The system was primarily write-oriented: 30-40k RPS for writes versus 1-2 RPS for reads. This is a typical feature of observability systems. Therefore, when writing, we minimized the number of operations – random shard selection, writing to a large ClickHouse cluster, without deduplication or unnecessary processing. When reading, we performed heavy cross-shard queries and added additional processing because we could afford it.

If you don't take the load profile into account, you can build an architecture that looks correct on the diagram but doesn't hold up in reality.

Fault tolerance as a basic requirement

Most Yandex services used tracing. This is telemetry. Without it, production becomes blind.
Therefore, installations were distributed across different data centers. The services had multiple replicas. Each ClickHouse shard also had multiple replicas.

We designed the system so that failures were inevitable, but data loss and unavailability were not.

What do such projects provide?

Working with a load of 11 gigabytes per second quickly discourages thinking in patterns. A popular solution isn't always the right one, and the "right" solution almost always ends up being a compromise between cost, reliability, and the nature of the workload.

In my System Design course, I discuss such cases in detail—with resource calculations, discussions of tradeoffs, and an explanation of why a particular solution was chosen. These aren't theoretical examples, but real-world situations where error is measured not in interview scores, but in thousands of cores and significant budgets.

The new cohort starts on March 3.

If you want to learn how to make architectural decisions for real-world workloads and feel confident in System Design interviews, details and registration for the course are available on the website:
