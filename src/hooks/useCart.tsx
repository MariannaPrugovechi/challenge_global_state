import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartUpdate = [...cart]
      const hasProduct = cartUpdate.find(product => product.id === productId)
      const productStock = await api.get(`/stock/${productId}`)
      const stockQntity = productStock.data.amount
      const productQntity = (hasProduct?.amount || 0) + 1
      if(stockQntity >= productQntity) {
        if(hasProduct) {
          hasProduct.amount = productQntity
        } else {
          const product = await api.get(`/products/${productId}`)
          const addProduct = {
            ...product.data,
            amount: 1
          }
          cartUpdate.push(addProduct)
        }
        setCart(cartUpdate)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdate))
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
      console.log(cart)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartItems = [...cart]
      const productIndex = cartItems.findIndex(product => { return product.id === productId})
      if (productIndex >= 0) {
        cartItems.splice(productIndex, 1)
        setCart(cartItems)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartItems))
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount === 0) {
        toast.error('Erro na alteração de quantidade do produto');
      } else {
        const updateAmount = [...cart]
        const productIndex = updateAmount.findIndex(product => { return product.id === productId})
        const productStock = await api.get(`/stock/${productId}`)
        const stockQntity = productStock.data.amount
        if (stockQntity >= amount) {
          updateAmount[productIndex].amount = amount
          setCart(updateAmount)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateAmount))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
