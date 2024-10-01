// payment.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StripeService } from '../../services/stripe/stripe.service';
import { CreatePaymentDto } from 'src/dto/payments/payment.dto';
import Payment from 'models/transaction.model';

@Controller('payment')
export class PaymentController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-customer')
  async createCustomer(@Body() data: { email: string }) {
    const customer = await this.stripeService.createCustomer(data.email);
    return { customer };
  }

  @Post('attach-payment-method')
  async attachPaymentMethod(
    @Body() data: { payment_method: string; customerId: string },
  ) {
    const paymentMethod =
      await this.stripeService.attachPaymentMethodToCustomer(
        data.payment_method,
        data.customerId,
      );
    return { paymentMethod };
  }

  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body()
    data: {
      amount: number;
      currency: string;
      customer: string;
      payment_method: any;
    },
  ) {
    const paymentIntent = await this.stripeService.createPaymentIntent(
      data.amount,
      data.currency,
      data.customer,
      data.payment_method,
    );
    return { clientSecret: paymentIntent.client_secret };
  }

  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body()
    data: {
      amount: number;
      currency: string;
      successUrl: string;
      cancelUrl: string;
      customerId: string;
    },
  ) {
    const session = await this.stripeService.createCheckoutSession(
      data.amount,
      data.currency,
      data.successUrl,
      data.cancelUrl,
      data.customerId,
    );
    return { sessionId: session.id };
  }

  @Post('create-invoice')
  async createInvoice(
    @Body() data: { customer: string; amount: number; description: string },
  ) {
    try {
      const { invoice, hostedInvoiceUrl } =
        await this.stripeService.createInvoice(
          data.customer,
          data.amount,
          data.description,
        );
      return { invoice, hostedInvoiceUrl };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('add-payment-record')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.stripeService.createPayment(createPaymentDto);
  }

  @Get('get-payments')
  async findAllPayments(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<{
    data: Payment[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.stripeService.findAll(page, limit);
  }
  @Get('payment/search')
  async searchModerators(@Query('searchValue') searchValue: string) {
    const result = await this.stripeService.searchPayment({ searchValue });
    return result;
  }
}
