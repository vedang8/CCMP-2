import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { LoginContext } from '../components/Context';
import { SetLoader } from '../redux/loadersSlice';
import { useDispatch } from 'react-redux';
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import Divider from "../components/Divider";
import CountdownTimer from '../components/CountdownTimer';
import imageSrc from '../images/wallpaper.gif';

const Home = () => {
  const { logindata, setLoginData } = useContext(LoginContext);
  const [forms, setForms] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);

  const getData = async () => {
    try {
      dispatch(SetLoader(true))

      const token = localStorage.getItem("usersdatatoken");
      const response = await fetch(`/get-all-sell-credit-forms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      dispatch(SetLoader(false))
      const data = await response.json();
      if (response.ok) {
        const curr = new Date();
        const filteredForms = data.forms.filter((form) => {
          const sellBeforeDate = new Date(form.sellBeforeDate);
          return sellBeforeDate >= curr;
        });
        setForms(filteredForms);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      dispatch(SetLoader(false))
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData()
  }, [])

  return (
    <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: `url(${imageSrc})` }}>
      <div className="container mx-auto px-2 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {forms
            .filter((form) => form.status === "Approved")
            .map((form) => (
              <div 
                key={form._id} 
                className="border border-gray-300 rounded-lg overflow-hidden shadow-md transition duration-300 ease-in-out transform hover:scale-105 bg-white"
                onClick={() => navigate(`/sell-credit/${form._id}`)}
              >
                <div className="relative overflow-hidden">
                  {form.images && form.images.length > 0 ? (
                    <img src={form.images[0]} className="w-full h-48 object-cover" alt="Credit form" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-200">No image available</div>
                  )}
                  <div className="absolute bottom-0 left-0 bg-white px-4 py-2">
                    <CountdownTimer targetDate={form.sellBeforeDate} />
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{form.user.fname}</h2>
                  <div className="flex items-center text-green-700">
                    <i className="ri-hand-coin-fill mr-2"></i>
                    <span className="text-xl font-semibold">{form.sellCredits}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
