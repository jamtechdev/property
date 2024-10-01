// stripe.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Payment from 'models/transaction.model';
import User from 'models/user.model';
import { CreatePaymentDto } from 'src/dto/payments/payment.dto';
import Stripe from 'stripe';
import { Op } from 'sequelize';
@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
  ) {
    this.stripe = new Stripe(
      'sk_test_51KAzYQIQIokKycYtQNHIoM2nmaYYJRY2o4fNCk8MSntmvG0UzFIa0kWa3THqaebmwYi8ATXjVY5mm21QWowgJNZn00rp5bFVex',
      {
        apiVersion: '2024-04-10', // Update to the latest Stripe API version
      },
    );
  }

  async createCustomer(email: string) {
    const customer = await this.stripe.customers.create({
      email,
    });
    return customer;
  }

  async attachPaymentMethodToCustomer(
    payment_method: string,
    customerId: string,
  ) {
    const paymentMethod = await this.stripe.paymentMethods.attach(
      payment_method,
      {
        customer: customerId,
      },
    );
    return paymentMethod;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customer: string,
    payment_method: any,
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer,
      payment_method: payment_method,
      off_session: true,
      confirm: true,
    });
    return paymentIntent;
  }

  async createInvoice(customer: string, amount: number, description: string) {
    try {
      // Create invoice item
      const invoiceItem = await this.stripe.invoiceItems.create({
        customer,
        currency: 'usd',
        amount,
        description,
      });

      // Create the invoice
      const invoice = await this.stripe.invoices.create({
        customer,
        collection_method: 'send_invoice',
        days_until_due: 30,
        auto_advance: true,
      });

      // Ensure invoice is finalized before attempting to retrieve hosted_invoice_url
      await this.stripe.invoices.finalizeInvoice(invoice.id);

      // Retrieve hosted_invoice_url from finalized invoice
      const finalizedInvoice = await this.stripe.invoices.retrieve(invoice.id);
      const hostedInvoiceUrl = finalizedInvoice.hosted_invoice_url;

      return {
        invoice: finalizedInvoice, // Return finalized invoice details
        hostedInvoiceUrl,
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async createCheckoutSession(
    amount: number,
    currency: string,
    successUrl: string,
    cancelUrl: string,
    customerId: string,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'plan',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session;
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentModel.create(createPaymentDto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Payment[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const { rows: data, count: totalRecords } =
      await this.paymentModel.findAndCountAll({
        include: [
          { model: User, attributes: ['id', 'username', 'email', 'firstname'] },
        ],
        offset,
        limit,
      });

    const totalPages = Math.ceil(totalRecords / limit);

    return { data, totalRecords, currentPage: page, totalPages };
  }

  async searchPayment(query: { searchValue?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.searchValue) {
      whereConditions[Op.or] = [
        { '$user.username$': { [Op.like]: `%${query.searchValue}%` } },
        { '$user.email$': { [Op.like]: `%${query.searchValue}%` } },
        { email: { [Op.like]: `%${query.searchValue}%` } }, // Case-insensitive search for email
      ];
    }

    const payments = await this.paymentModel.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email', 'firstname'],
        },
      ],
      order: [['createdAt', 'DESC']], // Optional: Order by creation date
    });

    return {
      payment: payments,
    };
  }
}
