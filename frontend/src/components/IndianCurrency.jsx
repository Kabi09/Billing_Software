// IndianCurrency.jsx
const IndianCurrency = ({ amount }) => {
  const formatted = new Intl.NumberFormat("en-IN").format(amount);

  return <span>₹ {formatted}</span>;
};



{/* 
  <IndianCurrency amount={y.revenue}/>
import IndianCurrency from "../components/IndianCurrency";

*/}
export default IndianCurrency;
