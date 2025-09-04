'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegister } from '@/hooks/api';
import { registerSchema, RegisterFormData } from '@/schemas/auth';
import { Gender, RegistrationType } from '@/types';
import { ClipLoader } from 'react-spinners';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registrationType: RegistrationType.CREATE_FAMILY,
      gender: Gender.PREFER_NOT_TO_SAY,
    },
  });

  const registrationType = watch('registrationType');

  const onSubmit = (data: RegisterFormData) => {
    // Clean up the data based on registration type
    const submitData = {
      ...data,
      ...(data.email === '' && { email: undefined }),
      ...(data.phone === '' && { phone: undefined }),
    };

    registerMutation.mutate(submitData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join or create your family tree
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Registration Type */}
          <div className="space-y-2">
            <Label>What would you like to do?</Label>
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant={registrationType === RegistrationType.CREATE_FAMILY ? 'default' : 'outline'}
                onClick={() => setValue('registrationType', RegistrationType.CREATE_FAMILY)}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Create New Family</div>
                  <div className="text-sm opacity-70">Start your own family tree</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={registrationType === RegistrationType.JOIN_FAMILY ? 'default' : 'outline'}
                onClick={() => setValue('registrationType', RegistrationType.JOIN_FAMILY)}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Join Existing Family</div>
                  <div className="text-sm opacity-70">Use an invitation code</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* Personal Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              onValueChange={(value) => setValue('gender', value as Gender)}
              defaultValue={Gender.PREFER_NOT_TO_SAY}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                <SelectItem value={Gender.MALE}>Male</SelectItem>
                <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                <SelectItem value={Gender.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-500 text-sm">{errors.gender.message}</p>
            )}
          </div>

          {/* Family-specific fields */}
          {registrationType === RegistrationType.CREATE_FAMILY && (
            <>
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  type="text"
                  {...register('familyName')}
                  placeholder="e.g., The Smith Family"
                />
                {errors.familyName && (
                  <p className="text-red-500 text-sm">{errors.familyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyDescription">Family Description (Optional)</Label>
                <Input
                  id="familyDescription"
                  type="text"
                  {...register('familyDescription')}
                  placeholder="Brief description of your family"
                />
                {errors.familyDescription && (
                  <p className="text-red-500 text-sm">{errors.familyDescription.message}</p>
                )}
              </div>
            </>
          )}

          {registrationType === RegistrationType.JOIN_FAMILY && (
            <div className="space-y-2">
              <Label htmlFor="invitationCode">Invitation Code</Label>
              <Input
                id="invitationCode"
                type="text"
                {...register('invitationCode')}
                placeholder="Enter invitation code"
              />
              {errors.invitationCode && (
                <p className="text-red-500 text-sm">{errors.invitationCode.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <ClipLoader size={16} color="white" />
                <span>Creating account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToLogin}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
