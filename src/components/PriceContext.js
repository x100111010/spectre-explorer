import { createContext } from "react";


const PriceContext = createContext({'price': 0});
PriceContext.displayName = "SprPrice";

export default PriceContext;
