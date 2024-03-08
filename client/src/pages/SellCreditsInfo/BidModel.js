import { Form, Input, Modal, message } from "antd";
import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetLoader } from "../../redux/loadersSlice";

function BidModel({ showBidModal, setShowBidModal, sellCredit, reloadData }) {
  const { user } = useSelector((state) => state.users);
  const formRef = React.useRef(null);
  const rules = [{ required: true, message: "Required" }];
  const dispatch = useDispatch();
  
  const onFinish = async (values) => {
    try {

      dispatch(SetLoader(true));
      const token = localStorage.getItem("usersdatatoken");
      const formDataWithUser = {
        ...values,
        sellCredits: sellCredit?.data?._id,
        seller: sellCredit?.data?.user?._id,
      };
      
      console.log(formDataWithUser);
      const response = await fetch("/place-new-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(formDataWithUser),
      });

      dispatch(SetLoader(false));

      if (response.ok) {
        message.success("Bid added successfully");
        message.success("🪙5 Credits are rewarded! 🎊");

        // send notification to seller
        const notifyUser = {
          title: "A new bid has been placed",
          message: `A new bid has been placed on your carbon credits 🪙${sellCredit?.data?.sellCredits} for 🫰🏻 ₹ ${formDataWithUser?.bidAmount}`,
          user: sellCredit?.data?.user?._id,
          onClick: `/profile`,
          read: false,
        };
        const notifyResponse = await fetch("/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(notifyUser),
        });

        reloadData();
        setShowBidModal(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(SetLoader(false));
      message.error(error.message);
    }
  };
  return (
    <Modal
      onCancel={() => setShowBidModal(false)}
      open={showBidModal}
      centered
      width={600}
      onOk={() => formRef.current.submit()}
    >
      <div className="flex flex-col gap-5 mb-5">
        <h1 className="text-2xl font-semibold text-orange-900 text-center">
          New Bid
        </h1>

        <Form layout="vertical" ref={formRef} onFinish={onFinish}>
          <Form.Item label="Bid Amount" name="bidAmount" rules={rules}>
            <Input />
          </Form.Item>

          <Form.Item label="Message" name="message" rules={rules}>
            <Input.TextArea />
          </Form.Item>

          <Form.Item label="Mobile" name="mobile" rules={rules}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

export default BidModel;
