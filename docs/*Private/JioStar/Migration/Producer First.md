Per Topic:

Migrate producers

- Stop the producer

- Drain the cluster

- Update bootstrap endpoints and other relevant configs

- Restart the producer against CC

Migrate consumers

- Stop the consumer.

- Update bootstrap endpoints and other relevant configs to point to CC.
    
    - _Ensure offset.reset ( and equivalent ) are set to Latest_
    

- Restart the consumer against CC.