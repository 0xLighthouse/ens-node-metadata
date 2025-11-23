import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function FAQs() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>About</AccordionTrigger>
        <AccordionContent>
          Harbor allows you to wrap a vesting position, grant or stream as a bond and sell it for
          liquidity on Uniswap V4.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does it work?</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside">
            <li>
              LPs trustlessly provide liquidity to a pool based on an immutable pricing algorithm.
              Typically the price will be set to the current price of the underlying token.
            </li>
            <li>
              Depending on the state of the pool, you will be able to receive tokens or a fungible
              claim to the underlying token.
            </li>
            <li>
              When a bond reaches maturity, if it is owned by the pool, LPs are able to redeem the
              bond for the underlying token and any associated incentives.
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What type of contracts do you support?</AccordionTrigger>
        <AccordionContent>
          We currently only support timelocked positions issued by our Timelock contract. or a
          Sablier transferable Timelock.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Are the contracts audited?</AccordionTrigger>
        <AccordionContent>
          Not yet. We are still in early development and are only deployed on Arbitrum Sepolia.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>I want this!</AccordionTrigger>
        <AccordionContent>
          Great. We would love to hear from you! Please drop us a line at{' '}
          <a className="underline" href="mailto:hello@lighthouse.cx">
            hello@lighthouse.cx
          </a>
          .
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
