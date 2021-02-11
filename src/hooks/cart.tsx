import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const json = await AsyncStorage.getItem('@GoMarket:product');

      if (json) {
        const listProduct = JSON.parse(json);

        setProducts(listProduct);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const listProduct = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
        }

        return product;
      });

      try {
        await AsyncStorage.setItem(
          '@GoMarket:product',
          JSON.stringify(listProduct),
        );

        setProducts(listProduct);
      } catch (e) {
        console.log(e);

        Alert.alert(
          'Erro ao incrementar o produto!',
          'Aconteceu um erro ao incrementar o produto, tente novamente!',
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      let listProduct = products.map(product => {
        if (product.id === id) {
          product.quantity -= 1;
        }

        return product;
      });

      const product = products.find(prod => prod.id === id);

      if (product && product.quantity === 0) {
        listProduct = products.filter(prod => prod.id !== id);
      }

      try {
        await AsyncStorage.setItem(
          '@GoMarket:product',
          JSON.stringify(listProduct),
        );

        setProducts(listProduct);
      } catch (e) {
        console.log(e);

        Alert.alert(
          'Erro ao decrementar o produto!',
          'Aconteceu um erro ao decrementar o produto, tente novamente!',
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const containsProduct = products.filter(prod => prod.id === product.id);

      if (containsProduct.length > 0) {
        increment(product.id);

        return;
      }

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      const listProduct = [...products, newProduct];

      try {
        await AsyncStorage.setItem(
          '@GoMarket:product',
          JSON.stringify(listProduct),
        );

        setProducts(listProduct);
      } catch (e) {
        console.log(e);

        Alert.alert(
          'Erro ao adicionar o produto!',
          'Aconteceu um erro ao adicionar o produto, tente novamente!',
        );
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
